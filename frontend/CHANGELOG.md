# @main/frontend

## 0.3.0

### Minor Changes

### Secure storage & google oauth

- **a211b49**
  - add initial setup wizard
  - added base platform fee
  - collapse custom domain dns when verified
  - make billing more compact by default
  - ensure billing uses email size bytes
  - remove yahoo and microsoft oauth for now
- **435f855**
  - fix email bodies loading bugs
  - fix cancelled subscription issues
  - fix local storage janky loading
- **ed9ee44**
  - fix download & preview attachments logic
  - show attachment list for emails in threads now
  - fix initial load not using cache
- **2de6fd7**
  - add ask questions rule
- **4375741**
  - implement oauth login for email accounts
  - save profile type (oauth or password) for send profiles too
  - link send profiles to email accounts for custom domains and oauth
  -
- **5db769b**
  - untested full migration
- **9e4df3d**
  - fix attachment lists across apps and add preview UIs
  - add in light/dark toggle for mobile

## 0.2.1

### Patch Changes

### Cleanup and cross-compat

- **7973cc0**
  - move the account selector to the drawer
- **f45e163**
  - Correctly show errors when sending emails
  - replace success dialog with toast
  - add support for viewing/editing custom domains from the mobile app

## 0.2.0

### Minor Changes

### Custom domain cleanup

- **3dbd682**
  - migrate from tabs on tabs to drawer
- **a274dce**
  - fix domain verification query filter
  - merge custom domain and imap/smtp profile edit modals
  - clean up web settings components
  - fix lagging types from previous migration
- **4e33672**
  - fix add domain logic
- **cbf8d9f**
  - remove extraneous signing params
- **502013d**
  - fix more infra
- **891129b**
  - update ses region
- **011b1b3**
  - fix types

## 0.1.2

### Patch Changes

### billing update

- **4a169f4**
  - fix stripe subscription logic to update existing subscriptions
  - add subscription info to mobile app
  - add subscription preview endpoint and logic

## 0.1.1

### Patch Changes

- version info
