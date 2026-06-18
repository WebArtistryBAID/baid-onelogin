export function hostedURL(path: string): URL {
    return new URL(path, process.env.HOSTED!)
}
