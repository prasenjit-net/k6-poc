import {check, group, sleep} from "k6";
import {b64encode} from 'k6/encoding';
import {Trend} from 'k6/metrics';
import {SharedArray} from "k6/data";
import execution from 'k6/execution';
import http from "k6/http";
// @ts-ignore
import {randomString} from "https://jslib.k6.io/k6-utils/1.1.0/index.js";

type User = {
    username: string,
    password: string,
}

const authorizeTrend = new Trend('app_authorize', true);
const loginTrend = new Trend('app_login', true);
const tokenTrend = new Trend('app_token', true);
const authExchangeTrend = new Trend('app_impersonate', true);
const introspectTrend = new Trend('app_introspect', true);
const revokeTrend = new Trend('app_revoke', true);
const logoutTrend = new Trend('app_logout', true);

const credFile = __ENV.CRED_FILE || 'cred.json';
const cred_file_data = JSON.parse(open(credFile));
const users = new SharedArray('users', () => {
    return cred_file_data.bp_users;
}) as User[];

const config = cred_file_data.bp_config;
const host = config.host;
const login_uri = `${host}/authep/login`
const tokenUrl = `${host}/oauth2/token`
const commonAuthUrl = `${host}/commonauth`
const introspectUrl = `${host}/oauth2/introspect`;
const revokeUrl = `${host}/oauth2/revoke`;
const logoutUrl = `${host}/oidc/logout`;
const client_id = config.client_id;
const client_secret = config.client_secret;
const redirect_uri = config.redirect_uri;
const scope = config.scope;
const evolve_client_id = config.evolve_client_id;
const evolve_client_secret = config.evolve_client_secret;

export const options = {
    vus: 1,
    // iterations: 10,
    thresholds: {
        // During the whole test execution, the error rate must be lower than 1%. changed.
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(90)<500'],
        app_authorize: ['p(90)<500'],
        app_login: ['p(90)<500'],
        app_token: ['p(90)<500'],
        app_impersonate: ['p(90)<500'],
        app_introspect: ['p(90)<500'],
        app_revoke: ['p(90)<500'],
        app_logout: ['p(90)<500'],
    },
}

export default function () {
    const user = users[execution.vu.idInTest % users.length]
    let auth_code: string = "";
    let id_token = "";
    let access_token = "";
    let refresh_token = "";
    const state = randomString(16);
    let result = true;

    group("login", () => {
        const authUrl = `${host}/oauth2/authorize?client_id=${client_id}&response_type=code&state=${state}&redirect_uri=${redirect_uri}&scope=${scope}`
        const resp = http.get(authUrl);
        authorizeTrend.add(resp.timings.duration);
        result = check(resp, {
            "authorize status is 200": (r) => r.status === 200,
            "redirects to login": (r) => r.url.startsWith(login_uri),
            "login page has state": (r) => r.url.includes(`state=${state}`),
        });
        if (!result) return;
        const sessionDataKey = resp.url.split("sessionDataKey=")[1].split("&")[0];
        const loginResp = http.post(commonAuthUrl, {
            username: user.username,
            password: user.password,
            sessionDataKey
        },{
            redirects: 1
        });
        loginTrend.add(loginResp.timings.duration);
        result = check(loginResp, {
            "login status is 302": (r) => r.status === 302,
            "login redirects to redirect_uri": (r) => r.headers["Location"].startsWith(redirect_uri),
            "state is returned": (r) => r.headers["Location"].includes(`state=${state}`),
            "code is issued": (r) => r.headers["Location"].includes(`code=`),
        });
        auth_code = loginResp.headers["Location"].split("code=")[1].split("&")[0];
    });

    group("token", () => {
        const resp = http.post(tokenUrl, {
            code: auth_code,
            grant_type: "authorization_code",
            redirect_uri: redirect_uri,
            scope, state,
        }, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${b64encode(`${client_id}:${client_secret}`)}`,
            }
        });
        tokenTrend.add(resp.timings.duration);
        result = check(resp, {
            "token status is 200": (r) => r.status === 200,
            "access token is returned": (r) => r.json("access_token") !== undefined,
            "id token is returned": (r) => r.json("id_token") !== undefined,
            "refresh token is returned": (r) => r.json("refresh_token") !== undefined,
        });
        access_token = resp.json("access_token") as string;
        id_token = resp.json("id_token") as string;
        refresh_token = resp.json("refresh_token") as string;
    });

    group("introspect", () => {
        const resp = http.post(introspectUrl, {
            token: access_token
        }, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            }
        });
        introspectTrend.add(resp.timings.duration);
        result = check(resp, {
            "introspect status is 200": (r) => r.status === 200,
            "introspect returns active": (r) => r.json("active") === true,
        });
        if (!result) return;
        const refreshResp = http.post(introspectUrl, {
            token: refresh_token
        }, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            }
        });
        introspectTrend.add(refreshResp.timings.duration);
        result = check(refreshResp, {
            "refresh introspect status is 200": (r) => r.status === 200,
            "refresh introspect returns active": (r) => r.json("active") === true,
        });
    });

    group("auth_exchange", () => {
        let result = true;
        const resp = http.post(tokenUrl, {
            grant_type: "auth_exchange",
            bp_client_id: client_id,
            refresh_token
        }, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${b64encode(`${evolve_client_id}:${evolve_client_secret}`)}`,
            }
        });
        authExchangeTrend.add(resp.timings.duration);
        result = check(resp, {
            "auth_exchange status is 200": (r) => r.status === 200,
            "auth_exchange returns access token": (r) => r.json("access_token") !== undefined,
            "auth_exchange returns id token": (r) => r.json("id_token") !== undefined,
            "auth_exchange returns refresh token": (r) => r.json("refresh_token") !== undefined,
        });
        if (!result) return;
        const exchange_token = resp.json("access_token") as string;
        const introResp = http.post(introspectUrl, {
            token: exchange_token
        }, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            }
        });
        introspectTrend.add(introResp.timings.duration);
        result = check(introResp, {
            "introspect status is 200": (r) => r.status === 200,
            "introspect returns active": (r) => r.json("active") === true,
        });
        if (!result) return;
        const revokeResp = http.post(revokeUrl, {
            token: exchange_token,
            token_type_hint: "access_token"
        }, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${b64encode(`${evolve_client_id}:${evolve_client_secret}`)}`,
            }
        });
        revokeTrend.add(revokeResp.timings.duration);
        result = check(revokeResp, {
            "revoke status is 200": (r) => r.status === 200,
        });
    });

    group("logout", () => {
        const url = `${logoutUrl}?id_token_hint=${id_token}&post_logout_redirect_uri=${redirect_uri}`;
        const resp = http.get(url, {
            redirects: 0,
        });
        logoutTrend.add(resp.timings.duration);
        result = check(resp, {
            "logout status is 302": (r) => r.status === 302,
            "logout redirects to redirect_uri": (r) => r.headers["Location"].startsWith(redirect_uri),
        });
        if (!result) return;
        const revokeResp = http.post(revokeUrl, {
            token: access_token,
            token_type_hint: "access_token"
        }, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${b64encode(`${client_id}:${client_secret}`)}`,
            }
        });
        revokeTrend.add(revokeResp.timings.duration);
        result = check(revokeResp, {
            "revoke status is 200": (r) => r.status === 200,
        });
    });
    sleep(1);
}
