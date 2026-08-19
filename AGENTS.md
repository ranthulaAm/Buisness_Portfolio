# Apple Typography & UI Guidelines

**Core system typefaces**
- Use 'system-ui' to leverage San Francisco (SF) on Apple platforms.
- Use dynamic optical sizing by relying on standard font variables.

**Weights and styles**
- Utilize a wide weight range (Ultralight to Black) to build visual hierarchy.

**Text Styles & Dynamic Type**
- Use semantic text styles (e.g., Large Title, Title 1-3, Headline, Body, Callout, Subheadline, Footnote, Caption 1-2). 
- Avoid hardcoded pixel values where possible, mapping Tailwind sizes to Apple's standard points:
  - xs: 12px / 16px (Caption 2)
  - sm: 13px / 18px (Footnote / Caption 1)
  - base: 17px / 22px (Body)
  - lg: 20px / 25px (Title 3)
  - xl: 22px / 28px (Title 2)
  - 2xl: 28px / 34px (Title 1)
  - 3xl: 34px / 41px (Large Title)

**Design philosophy**
- Typography is a primary tool for legibility and communicating information hierarchy.
- Always ensure text is adaptive and scales correctly across screen sizes.
