# Replit Dashboard Clone - Design Guidelines

## Design Approach
**Reference-Based Approach**: Drawing inspiration from Replit's established design language - clean, developer-focused interface with modern aesthetics and excellent usability.

## Core Design Elements

### Color Palette
**Dark Theme** (Primary):
- Background: 20 8% 8% (deep charcoal)
- Sidebar: 20 6% 12% (slightly lighter charcoal)
- Cards/Surfaces: 20 5% 15% (elevated surfaces)
- Border: 20 4% 22% (subtle borders)
- Text Primary: 0 0% 95% (near white)
- Text Secondary: 0 0% 65% (muted gray)
- Accent Blue: 213 94% 68% (Replit brand blue)
- Success Green: 142 76% 36% (for positive actions)

### Typography
- **Primary Font**: Inter (Google Fonts) - clean, modern sans-serif
- **Headings**: Font weights 600-700, sizes 24px-32px
- **Body Text**: Font weight 400-500, sizes 14px-16px
- **UI Labels**: Font weight 500, size 13px-14px

### Layout System
**Tailwind Spacing Units**: Consistent use of 2, 4, 6, 8, 12, 16, 24
- Sidebar width: 64 units (w-64)
- Card padding: p-6
- Section gaps: gap-6
- Icon sizes: 20px (w-5 h-5) and 24px (w-6 h-6)

### Component Library

**Sidebar Navigation**:
- Fixed left panel with Replit logo
- Search input with rounded corners and subtle background
- Navigation items with hover states and active indicators
- Clean iconography using Heroicons

**Main Content Area**:
- Personalized greeting with large, friendly typography
- Project input field with placeholder text and subtle styling
- Category selection as pill-shaped buttons with hover effects
- Project grid with consistent card dimensions and hover animations

**Project Cards**:
- Rounded corners (rounded-lg)
- Subtle shadows and hover elevation
- Thumbnail placeholders with consistent aspect ratios
- Typography hierarchy: title, description, metadata

**Interactive Elements**:
- Buttons with subtle backgrounds and clear hover states
- Form inputs with focus rings and proper contrast
- Smooth transitions (transition-all duration-200)

### Images
**No Hero Image**: This is a dashboard interface focused on functionality over marketing visuals.

**Project Thumbnails**: Small placeholder images (approximately 160x120px) representing different project types - use subtle gradients or geometric patterns rather than actual screenshots.

**Icons**: Consistent icon set from Heroicons for navigation and UI elements.

### Key Design Principles
1. **Developer-Focused**: Clean, distraction-free interface prioritizing productivity
2. **Modern Minimalism**: Generous whitespace with purposeful color usage
3. **Consistent Hierarchy**: Clear information architecture with proper visual weight
4. **Responsive Design**: Fluid layout that works across different screen sizes
5. **Accessibility**: High contrast ratios and keyboard navigation support

### Animations
Minimal and purposeful:
- Subtle hover states on interactive elements
- Smooth transitions for state changes (200ms duration)
- Card hover elevations with gentle shadows
- No distracting or excessive animations

This design maintains Replit's professional, developer-centric aesthetic while ensuring excellent usability and visual consistency throughout the interface.