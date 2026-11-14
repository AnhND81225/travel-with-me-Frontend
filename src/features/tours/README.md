# Tours and guides

The active tour/guide frontend is owned here:

```text
tours/
  api/           eventGuideApi.ts and API contract tests
  components/    CatalogForm, TourContentEditor, TourImagePicker and form tests
  pages/         ExpeditionsPage, ExpeditionDetailPage, EventsGuidesAdminPage
  validation/    tourGuideValidation.ts and validation tests
  styles/        tour-detail.css
```

Routes import pages directly. Cross-feature consumers import `api/eventGuideApi`; there are no compatibility files at the old paths. `AdminStaffPage` stays in the shared admin area because it manages both STAFF and GUIDE; its GUIDE form imports this feature. Home, reports, orders, schedules and payments only update their imports.

Schedules and participant booking remain in `features/schedules`; payments remain in `features/payment`. Shared authentication, layouts and generic UI utilities stay outside this feature. Legacy/reference components such as `ToursReference` are not part of this move.

Checks: `npm run lint`, `npm run build`, `npm run test:tour-guide`. Existing routes, API payloads, UI behavior and modal portal fixes are preserved.
