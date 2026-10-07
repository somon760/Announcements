import Foundation
import ImageIO
import CoreGraphics

let sourceURL = URL(fileURLWithPath: "/Users/madworks/Documents/GitHub/Announcements/.codex/third-floor-overlay-square.png") as CFURL
let outputURL = URL(fileURLWithPath: "/Users/madworks/Documents/GitHub/Announcements/CastleNaerytar_ThirdFloor_CIO_Overlay.png") as CFURL
guard let source = CGImageSourceCreateWithURL(sourceURL, nil),
      let image = CGImageSourceCreateImageAtIndex(source, 0, nil),
      let colorSpace = CGColorSpace(name: CGColorSpace.sRGB),
      let context = CGContext(data: nil, width: 2240, height: 2940, bitsPerComponent: 8, bytesPerRow: 0, space: colorSpace, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue),
      let destination = CGImageDestinationCreateWithURL(outputURL, "public.png" as CFString, 1, nil) else {
  exit(1)
}
context.clear(CGRect(x: 0, y: 0, width: 2240, height: 2940))
context.draw(image, in: CGRect(x: 0, y: 700, width: 2240, height: 2240))
guard let rendered = context.makeImage() else { exit(1) }
CGImageDestinationAddImage(destination, rendered, nil)
guard CGImageDestinationFinalize(destination) else { exit(1) }
