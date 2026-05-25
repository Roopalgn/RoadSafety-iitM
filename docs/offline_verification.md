# RoadSoS Offline Verification

Use this exact sequence before a judging demo.

## Chrome desktop

1. Start backend on `http://localhost:8001`.
2. Start frontend on `http://localhost:5174`.
3. Open `http://localhost:5174/`.
4. Tap **Refresh cache**.
5. Confirm the status row shows `offline shell ready`.
6. Open DevTools -> Network -> Offline.
7. Reload the page.
8. Tap **Start rescue drill**.
9. Expected: app shell loads from service worker, cached contacts or ERSS fallback are visible, and a warning explains cached/offline mode.

## Chrome Android

1. Open the local or deployed RoadSoS URL once while online.
2. Tap **Refresh cache**.
3. Use browser menu -> **Install app** if available.
4. Turn on airplane mode.
5. Open RoadSoS from the installed icon.
6. Expected: the app shell opens and official fallback guidance remains visible.

## Safari iOS

1. Open the deployed RoadSoS URL once while online.
2. Tap **Refresh cache**.
3. Use Share -> **Add to Home Screen**.
4. Turn on airplane mode.
5. Open RoadSoS from the home-screen icon.
6. Expected: app shell opens if Safari cached the service worker; otherwise state this as a platform/browser limitation.

## Known limits

- First-load offline is not supported.
- Cached contact data depends on tapping **Refresh cache** while online.
- Browser data clearing removes the cached rescue pack.
- RoadSoS does not dispatch emergency services or confirm live availability.
