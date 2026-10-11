# ---- build ----
FROM rust:1-slim-bookworm AS build
WORKDIR /src
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo 'fn main() {}' > src/main.rs && cargo build --release && rm -rf src
COPY . .
RUN touch src/main.rs && cargo build --release
# Writable mount points for the distroless nonroot user (uid 65532).
RUN mkdir -p /out/data /out/srv/sites /out/srv/uploads

# ---- run ----
# distroless/cc has glibc + libgcc only; TLS roots are compiled into the binary.
FROM gcr.io/distroless/cc-debian12:nonroot
COPY --from=build /src/target/release/folio /usr/local/bin/folio
COPY --from=build --chown=65532:65532 /out/ /
ENV DATABASE_URL=sqlite:///data/folio.db \
    SITES_DIR=/srv/sites \
    UPLOADS_DIR=/srv/uploads \
    LISTEN=0.0.0.0:3000 \
    INTERNAL_LISTEN=0.0.0.0:3001 \
    MALLOC_ARENA_MAX=2
EXPOSE 3000 3001
ENTRYPOINT ["/usr/local/bin/folio"]
CMD ["serve"]
