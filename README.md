# OneLogin

A more streamlined single sign-on system for BAID's SEIUE login. Built with Next.js.

Because SEIUE's API documentation sucks.

## Get Started

To run in production:

* This is not ready for production yet.

To run in development:

* Ensure that you have node.js and npm available.
* Run `npm install`.
* Copy `.env.example` to `.env` and fill the following environment variables:

| Name                | Description                                                                              |
|---------------------|------------------------------------------------------------------------------------------|
| `DATABASE_URL`      | The database URL to use. Typically `sqlite:///database.db`.                              |
| `JWT_SECRET`        | The JWT secret key to use. You can generate one with `openssl rand -hex 32`.             |
| `SEIUE_CLIENT_ID`   | The client ID received from SEIUE for authentication.                                    |
| `HOSTED`            | The location where OneLogin is hosted. No trailing slashes.                              |
| `UPLOAD_ROOT`       | The directory where uploaded files are stored. In development, this is `public/uploads`. |
| `UPLOAD_SERVE_PATH` | The path where uploaded files are served. In development, this is `uploads`.             |

* Run `npm run dev`.

## Contribution

To contribute, simply open a pull request.

## License

```
    OneLogin is a more streamlined single sign-on system.
    Copyright (C) 2024  Team WebArtistry

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
```
