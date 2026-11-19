# volto-juizi-maps (frontend)

The Volto side of the Map block. See the [repository README](../README.md)
and the [block's README](packages/volto-juizi-maps/src/components/Blocks/Map/README.md).

```sh
make install
pnpm start          # localhost:3018, proxies to the backend on :8098/Plone
CI=true pnpm test
pnpm lint
```

`PORT` and `RAZZLE_DEV_PROXY_API_PATH` override the defaults in
`package.json`'s start script.
