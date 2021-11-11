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

const authorizeTrend = new Trend('authorize', true);
const loginTrend = new Trend('login', true);
const tokenTrend = new Trend('login', true);

const credFile = __ENV.CRED_FILE || 'cred.json';
const cred_file_data = JSON.parse(open(credFile));
const users = new SharedArray('users', () => {
    return cred_file_data.csr_users;
}) as User[];

const config = cred_file_data.csr_config;
const host = config.host;
const login_uri = `${host}/authep/login`
const client_id = config.client_id;
const client_secret = config.client_secret;
const redirect_uri = config.redirect_uri;

export default function () {
    const user = users[execution.vu.idInTest % users.length]
    let auth_code: string = "";
    let id_token = "";
    let access_token = "";
    let refresh_token = "";
    const state = randomString(16);

    group("login", () => {
        const authUrl = `${host}/oauth2/authorize?client_id=${client_id}&response_type=code&state=${state}&redirect_uri=${redirect_uri}&scope=openid`
        const resp = http.get(authUrl);
        authorizeTrend.add(resp.timings.duration);
        check(resp, {
            "authorize status is 200": (r) => r.status === 200,
            "redirects to login": (r) => r.url.startsWith(login_uri),
            "login page has state": (r) => r.url.includes(`state=${state}`),
        });
        const loginResp = resp.submitForm({
            formSelector: '#form',
            fields: {
                username: user.username,
                password: user.password,
            },
            params: {
                redirects: 1
            },
            submitSelector: "button.button-login"
        });
        loginTrend.add(loginResp.timings.duration);
        check(loginResp, {
            "login status is 302": (r) => r.status === 302,
            "login redirects to redirect_uri": (r) => r.headers["Location"].startsWith(redirect_uri),
            "state is returned": (r) => r.headers["Location"].includes(`state=${state}`),
            "code is issued": (r) => r.headers["Location"].includes(`code=`),
        });
        auth_code = loginResp.headers["Location"].split("code=")[1].split("&")[0];
    });

    group("token", () => {
        const tokenUrl = `${host}/oauth2/token`
        const resp = http.post(tokenUrl, {
            code: auth_code,
            grant_type: "authorization_code",
            redirect_uri: redirect_uri,
            scope: "openid",
            state,
        }, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${b64encode(`${client_id}:${client_secret}`)}`,
            }
        });
        tokenTrend.add(resp.timings.duration);
        check(resp, {
            "token status is 200": (r) => r.status === 200,
            "access token is returned": (r) => r.json("access_token") !== undefined,
            "id token is returned": (r) => r.json("id_token") !== undefined,
            "refresh token is returned": (r) => r.json("refresh_token") !== undefined,
        });
        access_token = resp.json("access_token") as string;
        id_token = resp.json("id_token") as string;
        refresh_token = resp.json("refresh_token") as string;
    });
    console.log(`access_token: ${access_token}`);
    console.log(`id_token: ${id_token}`);
    console.log(`refresh_token: ${refresh_token}`);
    sleep(1);
}
