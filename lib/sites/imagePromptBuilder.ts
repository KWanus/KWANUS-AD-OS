export function buildHeroImagePrompt(niche: string, businessName: string, mood?: string): string {
  const moodDesc = mood ?? "professional, premium, modern";
  return `High-quality hero background image for a ${niche} business website called "${businessName}". Style: ${moodDesc}. Abstract gradient with subtle brand elements, suitable as a full-width hero section background. Dark, moody, premium feel with subtle light effects. No text, no logos, no people. 16:9 aspect ratio composition.`;
}

export function buildTestimonialAvatarPrompt(name: string, gender?: string): string {
  const g = gender ?? "neutral";
  return `Professional headshot portrait of a ${g} person named "${name}". Friendly, trustworthy expression. Neutral background, soft lighting, high quality. Suitable for a testimonial section avatar. Square composition.`;
}

export function buildProductImagePrompt(productName: string, category?: string): string {
  return `Clean product photography of "${productName}"${category ? ` in the ${category} category` : ""}. White or minimal background, studio lighting, high-end commercial style. Sharp focus, subtle shadows. Square composition suitable for e-commerce.`;
}

export function buildFeatureIconPrompt(featureTitle: string, style?: string): string {
  const s = style ?? "modern, minimalist";
  return `Simple icon illustration for "${featureTitle}". Style: ${s}, flat design with subtle gradient. Single color accent. Transparent-style background. 1:1 square, centered, clean.`;
}

export function buildGenericBlockImagePrompt(
  blockType: string,
  context: { niche?: string; businessName?: string; theme?: string }
): string {
  const nicheStr = context.niche ? ` for a ${context.niche} business` : "";
  const themeStr = context.theme === "light" ? "Light, clean, airy" : "Dark, premium, moody";

  switch (blockType) {
    case "hero":
      return buildHeroImagePrompt(context.niche ?? "professional services", context.businessName ?? "Business");
    case "about":
      return `Professional workspace or team environment photo${nicheStr}. ${themeStr} feel. Candid, authentic. No stock photo look. 16:9 composition.`;
    case "features":
      return `Abstract illustration representing technology and innovation${nicheStr}. ${themeStr} aesthetic with geometric shapes and gradients. No text. 16:9 composition.`;
    case "testimonials":
      return buildTestimonialAvatarPrompt("Professional Client");
    default:
      return `Professional, high-quality image suitable for a website ${blockType} section${nicheStr}. ${themeStr} mood. Clean, modern aesthetic. No text overlays. 16:9 composition.`;
  }
}
