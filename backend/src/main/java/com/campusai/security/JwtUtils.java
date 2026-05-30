package com.campusai.security;

import io.jsonwebtoken.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
public class JwtUtils {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expirationMs}")
    private int jwtExpirationMs;

    private java.security.Key key() {
        byte[] keyBytes;
        try {
            // Attempt to Base64-decode the secret key first
            keyBytes = io.jsonwebtoken.io.Decoders.BASE64.decode(jwtSecret);
            // HS512 strictly requires a key of at least 512 bits (64 bytes).
            // If the decoded key is too small, hash it using SHA-512.
            if (keyBytes.length < 64) {
                keyBytes = getSha512Bytes(jwtSecret);
            }
        } catch (Exception e) {
            // If decoding fails (e.g. secret is a plain text password/string),
            // hash it using SHA-512 to guarantee exactly 512 bits of key material.
            keyBytes = getSha512Bytes(jwtSecret);
        }
        return io.jsonwebtoken.security.Keys.hmacShaKeyFor(keyBytes);
    }

    private byte[] getSha512Bytes(String input) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-512");
            return digest.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-512 algorithm is not available in JRE", e);
        }
    }

    public String generateJwtToken(Authentication authentication) {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();

        return Jwts.builder()
                .setSubject((userPrincipal.getEmail()))
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(key(), SignatureAlgorithm.HS512)
                .compact();
    }

    public String getUserNameFromJwtToken(String token) {
        return Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(token).getBody().getSubject();
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(authToken);
            return true;
        } catch (SignatureException | MalformedJwtException | ExpiredJwtException | UnsupportedJwtException | IllegalArgumentException e) {
            System.err.println("Invalid JWT signature/token: " + e.getMessage());
        }
        return false;
    }
}
