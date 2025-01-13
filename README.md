# Strapi Blurhash Generator Plugin

Automatically generates Blurhash placeholders for uploaded images in [Strapi CMS](https://strapi.io). Provides lightweight and visually appealing placeholders optimized for lazy loading, enhancing user experience and improving performance.

## Requirement

Strapi v5≤

## Features

This plugin is inspired by and is a soft copy of [Strapi Blurhash](https://github.com/emil-petras/strapi-blurhash) but uses [Sharp](https://github.com/lovell/sharp/) and [Thumbhash](https://github.com/evanw/thumbhash) as the image processors, so this plugin can offering the following advantages:

- Better detail and colors
- Alpha support - You can keep the Transparency or fill the transparent space with any colors
- Supports various image formats - `jpeg, png, svg, avif, webp, gif`

## Installation

### Install my-project with npm

```bash
  npm install @aguzztn54/strapi-blurhash-plugin
```

### Install my-project with yarn

```bash
  yarn add @aguzztn54/strapi-blurhash-plugin
```

### Install my-project with pnpm

```bash
  pnpm install @aguzztn54/strapi-blurhash-plugin
```

## Configurations

This is an example configuration on file `config/plugins.js`

```js
module.exports = ({ env }) => ({
  blurhash: {
    enabled: true,
    config: {
      regenerateOnUpdate: true,
      forceRegenerateOnUpdate: false,
      flatten: false,
      flattenColor: {
        r: 100,
        g: 150,
        b: 57,
      },
    },
  },
});
```

| Properties                |       Types        | Default Value | Description                                                                                                                                                        |
| ------------------------- | :----------------: | :-----------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `regenerateOnUpdate`      |     `boolean`      |    `false`    | Regenerate Blurhash after updating media                                                                                                                           |
| `forceRegenerateOnUpdate` |     `boolean`      |    `false`    | If `false`, the blurhash will only be generated if it is currently missing                                                                                         |
| `flatten`                 |     `boolean`      |    `false`    | Remove Transparency and fill with color                                                                                                                            |
| `flattenColor`            | `object \| string` |    `white`    | Background color string or object, parsed by the [Color](https://github.com/Qix-/color?tab=readme-ov-file#constructors) Module, if unset, default color is `black` |

## How To Get the BlurHash

The `blurhash` attribute will automatically appear when you populate your API endpoint. Below is an example of the response you will receive.

```json
{
  "data": [
    {
      "id": 18,
      "documentId": "byxz57csj2ndeso36dp7gsf5",
      "title": "Ngantroe Park",
      "description": null,
      "createdAt": "2024-12-28T09:15:24.410Z",
      "updatedAt": "2025-01-13T11:05:12.910Z",
      "publishedAt": "2025-01-13T11:05:12.935Z",
      "locale": "id",
      "gallery": [
        {
          "id": 95,
          "documentId": "f8u5xd6a9bjt4khd0pzmmke3",
          "name": "f1-good-37eadc74.avif",
          "alternativeText": null,
          "caption": null,
          "width": null,
          "height": null,
          "formats": null,
          "hash": "f1_good_37eadc74_00f9a877f9",
          "ext": ".avif",
          "mime": "image/avif",
          "size": 18.18,
          "url": "/uploads/f1_good_37eadc74_00f9a877f9.avif",
          "previewUrl": null,
          "provider": "local",
          "provider_metadata": null,
          "createdAt": "2025-01-13T11:04:56.990Z",
          "updatedAt": "2025-01-13T11:04:56.990Z",
          "publishedAt": "2025-01-13T11:04:57.182Z",
          "blurhash": "GBgGDIR/iGdVqGeGYcWfJvoFVw=="
        }
      ]
    }
  ]
}
```

## How to use in Client Application

You will need [Thumbhash](https://github.com/evanw/thumbhash) to convert the Blurhash into an Image in your application, this module will works both in Node Server or browser environment.

```js
// if processed in node server
const decodedHash = Buffer.from(blurhash, 'base64').toString('binary');

// if processed directly in the browser
const decodedHash = atob(blurhash);

// Generate Image URL
const arrayBuffer = Uint8Array.from(decodedHash, (c) => c.charCodeAt(0));
const base64URL = Thumbhash.thumbHashToDataURL(arrayBuffer);
```

## License

[MIT](https://choosealicense.com/licenses/mit/)
