use aes_gcm::{
    Aes256Gcm, Nonce,
    aead::{Aead, KeyInit},
};
use base64::{Engine as _, engine::general_purpose::STANDARD};
use rand::RngCore;

pub trait CipherSuite: Send + Sync {
    fn encrypt(&self, plaintext: &[u8]) -> anyhow::Result<String>;
    fn decrypt(&self, ciphertext: &str) -> anyhow::Result<Vec<u8>>;
}

pub struct AesGcmCipher {
    key: [u8; 32],
}

impl AesGcmCipher {
    pub fn new(key: [u8; 32]) -> Self {
        Self { key }
    }
}

impl CipherSuite for AesGcmCipher {
    fn encrypt(&self, plaintext: &[u8]) -> anyhow::Result<String> {
        let cipher = Aes256Gcm::new_from_slice(&self.key)?;
        let mut nonce_bytes = [0u8; 12];
        rand::thread_rng().fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);

        let encrypted = cipher
            .encrypt(nonce, plaintext)
            .map_err(|_| anyhow::anyhow!("encryption failed"))?;
        let mut payload = nonce_bytes.to_vec();
        payload.extend_from_slice(&encrypted);
        Ok(STANDARD.encode(payload))
    }

    fn decrypt(&self, ciphertext: &str) -> anyhow::Result<Vec<u8>> {
        let payload = STANDARD.decode(ciphertext)?;
        let (nonce_bytes, encrypted) = payload.split_at(12);
        let cipher = Aes256Gcm::new_from_slice(&self.key)?;
        let nonce = Nonce::from_slice(nonce_bytes);
        let decrypted = cipher
            .decrypt(nonce, encrypted)
            .map_err(|_| anyhow::anyhow!("decryption failed"))?;
        Ok(decrypted)
    }
}

pub struct CryptoEngine {
    pub active_cipher: Box<dyn CipherSuite>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde::{Deserialize, Serialize};

    #[derive(Debug, Serialize, Deserialize, PartialEq)]
    struct DemoPayload {
        msg: String,
        level: u8,
    }

    #[test]
    fn encrypt_decrypt_roundtrip() {
        let key = *b"01234567890123456789012345678901";
        let crypto = CryptoEngine::from_bytes(key);
        let payload = DemoPayload {
            msg: "hello".to_string(),
            level: 5,
        };

        let encrypted = crypto.encrypt_json(&payload).expect("encrypt");
        let decrypted: DemoPayload = crypto.decrypt_json(&encrypted).expect("decrypt");
        assert_eq!(payload, decrypted);
    }
}

impl CryptoEngine {
    pub fn from_bytes(key: [u8; 32]) -> Self {
        Self {
            active_cipher: Box::new(AesGcmCipher::new(key)),
        }
    }

    pub fn encrypt_json<T: serde::Serialize>(&self, value: &T) -> anyhow::Result<String> {
        let bytes = serde_json::to_vec(value)?;
        self.active_cipher.encrypt(&bytes)
    }

    pub fn decrypt_json<T: for<'de> serde::Deserialize<'de>>(&self, encrypted: &str) -> anyhow::Result<T> {
        let bytes = self.active_cipher.decrypt(encrypted)?;
        Ok(serde_json::from_slice(&bytes)?)
    }
}
