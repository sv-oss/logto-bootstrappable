# Changelog

## [0.4.0](https://github.com/sv-oss/logto-bootstrappable/compare/v0.3.0...v0.4.0) (2026-04-20)


### Features

* **account:** add 2-step verification section to security page ([#8562](https://github.com/sv-oss/logto-bootstrappable/issues/8562)) ([836457b](https://github.com/sv-oss/logto-bootstrappable/commit/836457b2c40e1e378344b90b37bab01cafd0c44f))
* **account:** add social section to security page ([#8560](https://github.com/sv-oss/logto-bootstrappable/issues/8560)) ([44dcc5f](https://github.com/sv-oss/logto-bootstrappable/commit/44dcc5fa3180fe6e2a4e28e1772605d8b96e0d52))
* **accountCenter:** Improved styling for Account Centre portal page ([#22](https://github.com/sv-oss/logto-bootstrappable/issues/22)) ([4984d1e](https://github.com/sv-oss/logto-bootstrappable/commit/4984d1e88eeddb61ee94c0eec2296db0f21e5586))
* **console:** add localized OSS get started upsell ([#8584](https://github.com/sv-oss/logto-bootstrappable/issues/8584)) ([94769b1](https://github.com/sv-oss/logto-bootstrappable/commit/94769b1d56cd9b795ac28b3205bb007bdd7d3c0f))
* **console:** add oss email connector upsell banner ([#8582](https://github.com/sv-oss/logto-bootstrappable/issues/8582)) ([df9cb3e](https://github.com/sv-oss/logto-bootstrappable/commit/df9cb3e78a4a0392420af9253963d0f3b345d1ab))
* **console:** add OSS SAML upsell banners ([#8576](https://github.com/sv-oss/logto-bootstrappable/issues/8576)) ([5b3dfd1](https://github.com/sv-oss/logto-bootstrappable/commit/5b3dfd13c234ea76881a86cc1537f2281c8a5811))
* **console:** update OSS cloud upsell banner ([#8592](https://github.com/sv-oss/logto-bootstrappable/issues/8592)) ([b2ecaa4](https://github.com/sv-oss/logto-bootstrappable/commit/b2ecaa431d694b586a630ad717308862152970e6))
* **core,account:** support replacing authenticator app ([#8474](https://github.com/sv-oss/logto-bootstrappable/issues/8474)) ([67463a9](https://github.com/sv-oss/logto-bootstrappable/commit/67463a9ed65415bdc1980272c7cb7f52a02b4382))
* **core:** add delete grant by ID account API ([#8559](https://github.com/sv-oss/logto-bootstrappable/issues/8559)) ([57884b4](https://github.com/sv-oss/logto-bootstrappable/commit/57884b4372c94c608fe4f7635818e0e7f9cd09ab))
* **core:** add firebase-scrypt legacy hash support ([#8504](https://github.com/sv-oss/logto-bootstrappable/issues/8504)) ([727003f](https://github.com/sv-oss/logto-bootstrappable/commit/727003f7ff276e1ca046af0450c2fa77c29703df))
* **core:** add list user grants account API ([#8558](https://github.com/sv-oss/logto-bootstrappable/issues/8558)) ([4f9d7da](https://github.com/sv-oss/logto-bootstrappable/commit/4f9d7da2ac75969d398eee8afca40556aa742d60))
* **core:** remove dev feature guard for MFA sentinel ([#8575](https://github.com/sv-oss/logto-bootstrappable/issues/8575)) ([992cadb](https://github.com/sv-oss/logto-bootstrappable/commit/992cadb5a1716041b6f1c4cc2ff8df3f2d79af1a))
* **core:** Upstream OG Logto v1.38.0 ([b7d9846](https://github.com/sv-oss/logto-bootstrappable/commit/b7d984634c8093170562ed7a48f05a1498faf70e))
* **experience:** add Czech language support ([#8526](https://github.com/sv-oss/logto-bootstrappable/issues/8526)) ([5ab931e](https://github.com/sv-oss/logto-bootstrappable/commit/5ab931e7ac465ab9b5aa0259aacfa2a5c50f055a))
* Reduce logging noise for `/api/status` endpoint (toggleable via env var) ([739f8f9](https://github.com/sv-oss/logto-bootstrappable/commit/739f8f921b9ce444272446dfd87238b5b1a397ee))


### Bug Fixes

* **account:** center LogtoSignature in PageFooter when no links ([#8563](https://github.com/sv-oss/logto-bootstrappable/issues/8563)) ([eb60649](https://github.com/sv-oss/logto-bootstrappable/commit/eb606499f22f0598da8deed5255b9e5e08bae01a))
* **account:** guard deleting the last identifier ([#8533](https://github.com/sv-oss/logto-bootstrappable/issues/8533)) ([be4ffcc](https://github.com/sv-oss/logto-bootstrappable/commit/be4ffccdf7d006fa086f1da85075ead293427772))
* **console:** align bring your ui cloud upsell ([#8578](https://github.com/sv-oss/logto-bootstrappable/issues/8578)) ([bcc96f1](https://github.com/sv-oss/logto-bootstrappable/commit/bcc96f159ca210696fcc9e946ab02ce911116c74))
* **console:** hide token exchange settings for protected apps ([#8541](https://github.com/sv-oss/logto-bootstrappable/issues/8541)) ([0b4fc38](https://github.com/sv-oss/logto-bootstrappable/commit/0b4fc38d684de456fefbbca35011b6467320841b))
* **console:** passkey sign-in option checkboxes should be checked by default ([#8585](https://github.com/sv-oss/logto-bootstrappable/issues/8585)) ([29a7c96](https://github.com/sv-oss/logto-bootstrappable/commit/29a7c96547f0b97202e84d100be1abb89b1ece60))
* **console:** show passkey sign-in section in user details page only when enabled ([#8586](https://github.com/sv-oss/logto-bootstrappable/issues/8586)) ([8513000](https://github.com/sv-oss/logto-bootstrappable/commit/8513000d87cf57a525e30d8d8676fefd7cd8de72))
* **core:** cache oidc resource reads at the query layer ([#8359](https://github.com/sv-oss/logto-bootstrappable/issues/8359)) ([4c70c36](https://github.com/sv-oss/logto-bootstrappable/commit/4c70c3631f4cd1ca7a5e0e2701287181f5387d36))
* **core:** clean up leftover adaptive MFA dev guards ([#8571](https://github.com/sv-oss/logto-bootstrappable/issues/8571)) ([054aba1](https://github.com/sv-oss/logto-bootstrappable/commit/054aba1062d096359766afc0692bdd3747904211))
* **core:** retry database pool initialization on startup ([#8593](https://github.com/sv-oss/logto-bootstrappable/issues/8593)) ([634efcb](https://github.com/sv-oss/logto-bootstrappable/commit/634efcbbec7b26621f38331fa42d3baae76c95c2))
* **core:** use literal JSONB keys in OIDC adapter ([#8552](https://github.com/sv-oss/logto-bootstrappable/issues/8552)) ([7991ca7](https://github.com/sv-oss/logto-bootstrappable/commit/7991ca7d798888e7a5ba6c750f7eb9881c1fd33d))
* **deps:** update dependency nodemailer to ^8.0.4 ([#8598](https://github.com/sv-oss/logto-bootstrappable/issues/8598)) ([b6d68be](https://github.com/sv-oss/logto-bootstrappable/commit/b6d68be6fee40c94498cb1a4cb766f0f5bc7ae74))
* **deps:** update oidc-provider digest to 5570006 ([#8323](https://github.com/sv-oss/logto-bootstrappable/issues/8323)) ([96fce44](https://github.com/sv-oss/logto-bootstrappable/commit/96fce449767dbcd7583c0124d8d9eda0b079fff4))
* **experience:** add missing language-to-country mappings in countryCallingCodeMap ([#8555](https://github.com/sv-oss/logto-bootstrappable/issues/8555)) ([dcfbaf2](https://github.com/sv-oss/logto-bootstrappable/commit/dcfbaf20cb60158f9a2855494614ac331b353220))
* **experience:** show sign-in loading during passkey sign-in ([#8561](https://github.com/sv-oss/logto-bootstrappable/issues/8561)) ([b19a567](https://github.com/sv-oss/logto-bootstrappable/commit/b19a567b96d9217dd92f8b1b3de9048938afe658))
* **test:** run package vitest tests in non-watch mode ([#8428](https://github.com/sv-oss/logto-bootstrappable/issues/8428)) ([d1b64a8](https://github.com/sv-oss/logto-bootstrappable/commit/d1b64a8d3d35109cbe33255af1dfb225601f4b94))

## [0.3.0](https://github.com/sv-oss/logto-bootstrappable/compare/v0.2.0...v0.3.0) (2026-03-26)


### Features

* **Core:** Add support for custom OIDC Claim ([#15](https://github.com/sv-oss/logto-bootstrappable/issues/15)) ([692ba1a](https://github.com/sv-oss/logto-bootstrappable/commit/692ba1a9f81e60870ed428c02dc1e5b0885ebea1))

## [0.2.0](https://github.com/sv-oss/logto-bootstrappable/compare/v0.1.0...v0.2.0) (2026-03-25)


### Features

* **cli:** Self-Registration is now configurable in bootstrapping ([#11](https://github.com/sv-oss/logto-bootstrappable/issues/11)) ([75714f2](https://github.com/sv-oss/logto-bootstrappable/commit/75714f2c6fa5d3e661a427f836d5e31556ec434d))
* **Core:** Logging improvements ([#14](https://github.com/sv-oss/logto-bootstrappable/issues/14)) ([1626ea0](https://github.com/sv-oss/logto-bootstrappable/commit/1626ea08f113ab1ad956490931a7c41c590dbd98))
* Logging improvements ([#13](https://github.com/sv-oss/logto-bootstrappable/issues/13)) ([8669117](https://github.com/sv-oss/logto-bootstrappable/commit/8669117db8f24a69b4b3b34cc762369b4a9408d9))

## 0.1.0 (2026-03-23)

Note: This release includes the original fork from [logto-io/logto](https://github.com/logto-io/logto),
which was taken from their release [1.37.1](https://github.com/logto-io/logto/releases/tag/v1.37.1).

### Features

* Add a sign out button to the account center ([97daee0](https://github.com/sv-oss/logto-bootstrappable/commit/97daee0e1b7e6c33418d9818c077a5b83c6493d1))
* Add management dashboard [wip] ([d406895](https://github.com/sv-oss/logto-bootstrappable/commit/d406895437118ddca84cf9b280dc5cc12e404e8b))
* Add management frontend ([fe6a475](https://github.com/sv-oss/logto-bootstrappable/commit/fe6a475296d3fd9df44fbd84f6ce3abfbb6fce3f))
* add quota guard to passkey sign-in feature ([#8361](https://github.com/sv-oss/logto-bootstrappable/issues/8361)) ([d6c6e89](https://github.com/sv-oss/logto-bootstrappable/commit/d6c6e899c96a8eb275d83e154f5860e94b1c31ce))
* **api:** add createManagementApiClient for custom authentication ([#8199](https://github.com/sv-oss/logto-bootstrappable/issues/8199)) ([83b7c94](https://github.com/sv-oss/logto-bootstrappable/commit/83b7c941876d85ebbb4bbc02f8b0ccfbcc4c2cec))
* Autoconfigure Sign-In Experience ([9e24263](https://github.com/sv-oss/logto-bootstrappable/commit/9e2426398960420e3e2b619e7aadeaf680affdec))
* Bootstrap Environment ([#3](https://github.com/sv-oss/logto-bootstrappable/issues/3)) ([249baa4](https://github.com/sv-oss/logto-bootstrappable/commit/249baa499ffe3edee6747ac7c5e8addbf326c84c))
* Bootstrap MFA config ([0a82a96](https://github.com/sv-oss/logto-bootstrappable/commit/0a82a96276bb4c3edeaa992ac8ae466791a21a3c))
* Cleanup management portal page ([32d268a](https://github.com/sv-oss/logto-bootstrappable/commit/32d268a01c1d7c7145204a0f362da3e8cc507c23))
* **cli:** add environment-variable-driven bootstrap for zero-click setup ([9b745cf](https://github.com/sv-oss/logto-bootstrappable/commit/9b745cf23cde95d4ba68dfe412d39221c792620b))
* **cli:** make email the primary user identifier for bootstrap ([dd9d49c](https://github.com/sv-oss/logto-bootstrappable/commit/dd9d49cf6898b83c105b0c979d0703bfe6e5c064))
