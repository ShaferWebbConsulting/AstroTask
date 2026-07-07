FROM rust:1.88-slim
WORKDIR /app
COPY Cargo.toml Cargo.lock* ./
COPY src ./src
RUN cargo build --release
EXPOSE 8080
CMD ["./target/release/backend"]
