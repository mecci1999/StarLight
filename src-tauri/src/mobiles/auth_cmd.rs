use std::{collections::BTreeMap, time::Duration};

use reqwest::{header, Client};
use serde::{Deserialize, Serialize};

const AUTH_BASE_URL: &str = "https://api.starlight.host";
const MAX_AUTH_RESPONSE_BYTES: usize = 256 * 1024;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IosAuthPostRequest {
    endpoint: IosAuthEndpoint,
    body_json: String,
    authorization: Option<String>,
    timeout_ms: u64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
enum IosAuthEndpoint {
    Login,
    VerifyCode,
    QrScan,
    QrConfirm,
    QrCancel,
    RefreshToken,
}

impl IosAuthEndpoint {
    fn path(&self) -> &'static str {
        match self {
            Self::Login => "/api/auth/v1/login",
            Self::VerifyCode => "/api/auth/v1/verifyCode",
            Self::QrScan => "/api/auth/v1/qrcode/scan",
            Self::QrConfirm => "/api/auth/v1/qrcode/confirm",
            Self::QrCancel => "/api/auth/v1/qrcode/cancel",
            Self::RefreshToken => "/api/auth/v1/refreshToken",
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IosAuthPostResponse {
    status: u16,
    headers: BTreeMap<String, Vec<String>>,
    body_text: String,
}

#[tauri::command]
pub async fn ios_auth_post(request: IosAuthPostRequest) -> Result<IosAuthPostResponse, String> {
    let timeout = Duration::from_millis(request.timeout_ms.clamp(1_000, 60_000));
    let client = Client::builder()
        .https_only(true)
        .connect_timeout(timeout)
        .timeout(timeout)
        .build()
        .map_err(|error| format!("failed to create iOS auth client: {error}"))?;

    let mut builder = client
        .post(format!("{}{}", AUTH_BASE_URL, request.endpoint.path()))
        .header(header::ACCEPT, "application/json")
        .header(header::CONTENT_TYPE, "application/json")
        .body(request.body_json);

    if let Some(authorization) = request.authorization {
        builder = builder.header(header::AUTHORIZATION, authorization);
    }

    let response = builder
        .send()
        .await
        .map_err(|error| format!("iOS auth request failed: {error}"))?;
    let status = response.status().as_u16();
    let headers = response.headers().iter().fold(BTreeMap::new(), |mut result, (name, value)| {
        if let Ok(value) = value.to_str() {
            result.entry(name.as_str().to_owned()).or_insert_with(Vec::new).push(value.to_owned());
        }
        result
    });
    let body = response
        .bytes()
        .await
        .map_err(|error| format!("failed to read iOS auth response: {error}"))?;

    if body.len() > MAX_AUTH_RESPONSE_BYTES {
        return Err("iOS auth response exceeded the allowed size".to_owned());
    }

    let body_text = String::from_utf8(body.to_vec()).map_err(|_| "iOS auth response was not UTF-8".to_owned())?;
    Ok(IosAuthPostResponse { status, headers, body_text })
}
