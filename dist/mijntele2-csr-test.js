/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ mijntele2_csr_test),
  "options": () => (/* binding */ options)
});

;// CONCATENATED MODULE: external "k6"
const external_k6_namespaceObject = require("k6");;
;// CONCATENATED MODULE: external "k6/encoding"
const encoding_namespaceObject = require("k6/encoding");;
;// CONCATENATED MODULE: external "k6/metrics"
const metrics_namespaceObject = require("k6/metrics");;
;// CONCATENATED MODULE: external "k6/data"
const data_namespaceObject = require("k6/data");;
;// CONCATENATED MODULE: external "k6/execution"
const execution_namespaceObject = require("k6/execution");;
var execution_default = /*#__PURE__*/__webpack_require__.n(execution_namespaceObject);
;// CONCATENATED MODULE: external "k6/http"
const http_namespaceObject = require("k6/http");;
var http_default = /*#__PURE__*/__webpack_require__.n(http_namespaceObject);
;// CONCATENATED MODULE: external "https://jslib.k6.io/k6-utils/1.1.0/index.js"
const index_js_namespaceObject = require("https://jslib.k6.io/k6-utils/1.1.0/index.js");;
;// CONCATENATED MODULE: ./src/mijntele2-csr-test.ts





 // @ts-ignore


var authorizeTrend = new metrics_namespaceObject.Trend('app_authorize', true);
var loginTrend = new metrics_namespaceObject.Trend('app_login', true);
var tokenTrend = new metrics_namespaceObject.Trend('app_token', true);
var impersonateTrend = new metrics_namespaceObject.Trend('app_impersonate', true);
var introspectTrend = new metrics_namespaceObject.Trend('app_introspect', true);
var revokeTrend = new metrics_namespaceObject.Trend('app_revoke', true);
var logoutTrend = new metrics_namespaceObject.Trend('app_logout', true);
var credFile = __ENV.CRED_FILE || 'cred.json';
var cred_file_data = JSON.parse(open(credFile));
var users = new data_namespaceObject.SharedArray('users', function () {
  return cred_file_data.csr_users;
});
var config = cred_file_data.csr_config;
var host = config.host;
var login_uri = "".concat(host, "/authep/login");
var tokenUrl = "".concat(host, "/oauth2/token");
var introspectUrl = "".concat(host, "/oauth2/introspect");
var revokeUrl = "".concat(host, "/oauth2/revoke");
var logoutUrl = "".concat(host, "/oidc/logout");
var client_id = config.client_id;
var client_secret = config.client_secret;
var redirect_uri = config.redirect_uri;
var scope = config.scope;
var options = {
  stages: [{
    duration: "2s",
    target: "2"
  }, {
    duration: "2s",
    target: "2"
  }, {
    duration: "2s",
    target: "0"
  }],
  thresholds: {
    // During the whole test execution, the error rate must be lower than 1%.
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(90)<500'],
    app_authorize: ['p(90)<500'],
    app_login: ['p(90)<500'],
    app_token: ['p(90)<500'],
    app_impersonate: ['p(90)<500'],
    app_introspect: ['p(90)<500'],
    app_revoke: ['p(90)<500'],
    app_logout: ['p(90)<500']
  }
};
/* harmony default export */ function mijntele2_csr_test() {
  var user = users[(execution_default()).vu.idInTest % users.length];
  var auth_code = "";
  var id_token = "";
  var access_token = "";
  var refresh_token = "";
  var state = (0,index_js_namespaceObject.randomString)(16);
  var result = true;
  (0,external_k6_namespaceObject.group)("login", function () {
    var authUrl = "".concat(host, "/oauth2/authorize?client_id=").concat(client_id, "&response_type=code&state=").concat(state, "&redirect_uri=").concat(redirect_uri, "&scope=").concat(scope);
    var resp = http_default().get(authUrl);
    authorizeTrend.add(resp.timings.duration);
    result = (0,external_k6_namespaceObject.check)(resp, {
      "authorize status is 200": function authorizeStatusIs200(r) {
        return r.status === 200;
      },
      "redirects to login": function redirectsToLogin(r) {
        return r.url.startsWith(login_uri);
      },
      "login page has state": function loginPageHasState(r) {
        return r.url.includes("state=".concat(state));
      }
    });
    if (!result) return;
    var loginResp = resp.submitForm({
      formSelector: '#form',
      fields: {
        username: user.username,
        password: user.password
      },
      params: {
        redirects: 1
      },
      submitSelector: "button.button-login"
    });
    loginTrend.add(loginResp.timings.duration);
    result = (0,external_k6_namespaceObject.check)(loginResp, {
      "login status is 302": function loginStatusIs302(r) {
        return r.status === 302;
      },
      "login redirects to redirect_uri": function loginRedirectsToRedirect_uri(r) {
        return r.headers["Location"].startsWith(redirect_uri);
      },
      "state is returned": function stateIsReturned(r) {
        return r.headers["Location"].includes("state=".concat(state));
      },
      "code is issued": function codeIsIssued(r) {
        return r.headers["Location"].includes("code=");
      }
    });
    auth_code = loginResp.headers["Location"].split("code=")[1].split("&")[0];
  });
  (0,external_k6_namespaceObject.group)("token", function () {
    var resp = http_default().post(tokenUrl, {
      code: auth_code,
      grant_type: "authorization_code",
      redirect_uri: redirect_uri,
      scope: scope,
      state: state
    }, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic ".concat((0,encoding_namespaceObject.b64encode)("".concat(client_id, ":").concat(client_secret)))
      }
    });
    tokenTrend.add(resp.timings.duration);
    result = (0,external_k6_namespaceObject.check)(resp, {
      "token status is 200": function tokenStatusIs200(r) {
        return r.status === 200;
      },
      "access token is returned": function accessTokenIsReturned(r) {
        return r.json("access_token") !== undefined;
      },
      "id token is returned": function idTokenIsReturned(r) {
        return r.json("id_token") !== undefined;
      },
      "refresh token is returned": function refreshTokenIsReturned(r) {
        return r.json("refresh_token") !== undefined;
      }
    });
    access_token = resp.json("access_token");
    id_token = resp.json("id_token");
    refresh_token = resp.json("refresh_token");
  });
  (0,external_k6_namespaceObject.group)("introspect", function () {
    var resp = http_default().post(introspectUrl, {
      token: access_token
    }, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });
    introspectTrend.add(resp.timings.duration);
    result = (0,external_k6_namespaceObject.check)(resp, {
      "introspect status is 200": function introspectStatusIs200(r) {
        return r.status === 200;
      },
      "introspect returns active": function introspectReturnsActive(r) {
        return r.json("active") === true;
      }
    });
    if (!result) return;
    var refreshResp = http_default().post(introspectUrl, {
      token: refresh_token
    }, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });
    introspectTrend.add(refreshResp.timings.duration);
    result = (0,external_k6_namespaceObject.check)(refreshResp, {
      "refresh introspect status is 200": function refreshIntrospectStatusIs200(r) {
        return r.status === 200;
      },
      "refresh introspect returns active": function refreshIntrospectReturnsActive(r) {
        return r.json("active") === true;
      }
    });
  });
  (0,external_k6_namespaceObject.group)("impersonate", function () {
    var result = true;
    var resp = http_default().post(tokenUrl, {
      grant_type: "impersonate",
      csr_token: access_token,
      scope: scope,
      username: "se-team@consumer.tele2.nl"
    }, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic ".concat((0,encoding_namespaceObject.b64encode)("".concat(client_id, ":").concat(client_secret)))
      }
    });
    impersonateTrend.add(resp.timings.duration);
    result = (0,external_k6_namespaceObject.check)(resp, {
      "impersonate status is 200": function impersonateStatusIs200(r) {
        return r.status === 200;
      },
      "impersonate returns access token": function impersonateReturnsAccessToken(r) {
        return r.json("access_token") !== undefined;
      },
      "impersonate returns id token": function impersonateReturnsIdToken(r) {
        return r.json("id_token") !== undefined;
      },
      "impersonate returns refresh token": function impersonateReturnsRefreshToken(r) {
        return r.json("refresh_token") !== undefined;
      }
    });
    if (!result) return;
    var dsl_token = resp.json("access_token");
    var introResp = http_default().post(introspectUrl, {
      token: dsl_token
    }, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });
    introspectTrend.add(introResp.timings.duration);
    result = (0,external_k6_namespaceObject.check)(introResp, {
      "introspect status is 200": function introspectStatusIs200(r) {
        return r.status === 200;
      },
      "introspect returns active": function introspectReturnsActive(r) {
        return r.json("active") === true;
      }
    });
    if (!result) return;
    var revokeResp = http_default().post(revokeUrl, {
      token: dsl_token,
      token_type_hint: "access_token"
    }, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic ".concat((0,encoding_namespaceObject.b64encode)("".concat(client_id, ":").concat(client_secret)))
      }
    });
    revokeTrend.add(revokeResp.timings.duration);
    result = (0,external_k6_namespaceObject.check)(revokeResp, {
      "revoke status is 200": function revokeStatusIs200(r) {
        return r.status === 200;
      }
    });
  });
  (0,external_k6_namespaceObject.group)("logout", function () {
    var url = "".concat(logoutUrl, "?id_token_hint=").concat(id_token, "&post_logout_redirect_uri=").concat(redirect_uri);
    var resp = http_default().get(url, {
      redirects: 0
    });
    logoutTrend.add(resp.timings.duration);
    result = (0,external_k6_namespaceObject.check)(resp, {
      "logout status is 200": function logoutStatusIs200(r) {
        return r.status === 302;
      },
      "logout redirects to redirect_uri": function logoutRedirectsToRedirect_uri(r) {
        return r.headers["Location"].startsWith(redirect_uri);
      }
    });
  });
  (0,external_k6_namespaceObject.sleep)(1);
}
var __webpack_export_target__ = exports;
for(var i in __webpack_exports__) __webpack_export_target__[i] = __webpack_exports__[i];
if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ })()
;
//# sourceMappingURL=mijntele2-csr-test.js.map