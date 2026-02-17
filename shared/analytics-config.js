/* TinyHumanMD client analytics config.
   Values here are browser-visible IDs/tokens, not server secrets. */
(function () {
  'use strict';

  var cfg = window.__ANALYTICS__ || {};

  if (!cfg.gaId) cfg.gaId = 'G-FMNPFLW6LD';
  if (!cfg.cfBeaconToken) cfg.cfBeaconToken = 'ORoKf_LNQXvvbwAbBeUKkfuweRRmGYblp-qmAjgI';
  if (!cfg.clarityProject) cfg.clarityProject = '';
  if (!cfg.ipApiKey) cfg.ipApiKey = '';
  if (!cfg.posthogKey) cfg.posthogKey = '';
  if (!cfg.posthogHost) cfg.posthogHost = 'https://app.posthog.com';

  window.__ANALYTICS__ = cfg;
})();
