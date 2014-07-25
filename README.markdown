# Yeller Notifier for Browser JavaScript

This library gives you instant notification of errors in your site's JavaScript.

### BETA

This is a beta version, so the instructions aren't fully integrated into yeller's
onboarding yet. It's been tested a bunch, and it's ready for production use,
just the onboarding flow isn't quite there yet.

## How to Install

Include yeller.js from our CDN in the `<head>` tag of your site, before all
other `<script>` tags.

```html
<script src="//js-yellerapp.a.ssl.fastly.net/yeller.js">
```

Then immediately configure Yeller in another `<script>` tag in your `<head>`

```javascript
Yeller.configure({
  token: 'YOUR_API_TOKEN_HERE'
});
```

That's it for basic configuration. There are a few more advanced settings
later, but let's get you tracking errors first.

### Tracking Errors

`yeller.js` automatically tracks errors by default, but if you want to manually
track one, you can do that like this:

```javascript
try {
  // your code here
} catch(error) {
  Yeller.report(error);
}
```

### Setting environments

Yeller keeps track of which environment your application is runing in, and
segregates errors by environment. To set your environment, simply pass it
in in your call to `Yeller.configure`

```javascript
Yeller.configure({
  token: 'YOUR_API_TOKEN_HERE',
  environment: 'production'
});
```

Environments are simply strings. As a default, Yeller will ignore errors sent
in the `test` or `development` environments.

### Passing in More Data

`yeller.js` also lets you attach additional data to your exception. The library
already includes information about the page, the web browser and so on.

```javascript
try {
  // your code here
} catch(error) {
  Yeller.report(error, { custom_data: { user_id: user.id }});
}
```

Attaching more debugging information gives you powerful diagnosis across all
your exceptions.
