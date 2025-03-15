# Strapi Blurhash Generator Plugin

Automatically generates Blurhash placeholders for uploaded images in [Strapi CMS](https://strapi.io). Provides lightweight and visually appealing placeholders optimized for lazy loading, enhancing user experience and improving performance.

## Requirement

Strapi v5 or newer

## Features

This plugin is inspired by and is a soft copy of [Strapi Blurhash](https://github.com/emil-petras/strapi-blurhash) but uses [Sharp](https://github.com/lovell/sharp/) and [Thumbhash](https://github.com/evanw/thumbhash) as the image processors, so this plugin can offering the following advantages:

- Better detail and colors
- Alpha support - You can keep the Transparency or fill the transparent space with any colors
- Supports various image formats - `jpeg, png, svg, avif, webp, gif`

## Installation

### Install with npm

```bash
  npm install @aguzztn54/strapi-blurhash-plugin
```

### Install with yarn

```bash
  yarn add @aguzztn54/strapi-blurhash-plugin
```

### Install with pnpm

```bash
  pnpm install @aguzztn54/strapi-blurhash-plugin
```

## Configurations

This is an example configuration on file `config/plugins.ts` or `config/plugins.js`

```js
// config/plugins.ts
import type { BlurhashConfig } from '@aguzztn54/strapi-blurhash-plugin/dist/server/types';

interface PluginConfig extends BlurhashConfig {
  [key: string]: any;
}
export default ({ env }): PluginConfig => ({
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
  // ... another Plugin
});
```

| Properties                |       Types        | Default Value | Description                                                                                                                                                        |
| ------------------------- | :----------------: | :-----------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `regenerateOnUpdate`      |     `boolean`      |    `false`    | Regenerate Blurhash when media is updated. If the media is replaced or cropped, this plugin will continue generating a new Blurhash string                         |
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
      "gallery": [
        {
          "id": 95,
          "documentId": "f8u5xd6a9bjt4khd0pzmmke3",
          "name": "f1-good-37eadc74.avif",
          "hash": "f1_good_37eadc74_00f9a877f9",
          "ext": ".avif",
          "mime": "image/avif",
          "size": 18.18,
          "url": "/uploads/f1_good_37eadc74_00f9a877f9.avif",
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

## Changelog

#### [0.1.2] - 15 Mar 2025

**Major Changes**

- Use the same `Sharp` version as Strapi
- Now, Blurhash is generated in the middleware before the media is uploaded to the storage server. However, updating the Blurhash still fetches the image from the Storage Server and may fail depending on your Storage Server configuration.
- Use the same `Axios` package as Strapi instead of `node-fetch` to fetch images when regenerating Blurhash, eliminating the need for additional dependencies.
- Optimizing Dependencies

#### [0.1.1] - 13 Jan 2025

- Transparent or Flatten Blurhash Support

#### [0.1.0] - 12 Jan 2025

- Initial Relase
- Various mimetype support
