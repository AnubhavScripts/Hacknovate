# Assistly Onboarding Flow - Implementation Guide

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── onboarding/
│   │   │   ├── OnboardingLayout.jsx       # Main onboarding container
│   │   │   ├── Step1Welcome.jsx           # Welcome screen
│   │   │   ├── Step2Automations.jsx       # Automation selection
│   │   │   ├── Step3Channels.jsx          # Channel connection
│   │   │   └── Step4Deploy.jsx            # Deployment/loading
│   │   ├── ui/
│   │   │   ├── Button.jsx                 # Custom button component
│   │   │   ├── Card.jsx                   # Card component
│   │   │   ├── Progress.jsx               # Progress bar
│   │   │   ├── Badge.jsx                  # Badge component
│   │   │   ├── Checkbox.jsx               # Checkbox component
│   │   │   └── Toast.jsx                  # Toast notifications
│   │   └── Sidebar.jsx                    # Dashboard sidebar
│   ├── store/
│   │   └── onboardingStore.js             # Zustand state management
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── Login.jsx
│   │   ├── SignUp.jsx
│   │   ├── Onboarding.jsx                 # Onboarding page
│   │   └── Dashboard.jsx                  # Dashboard page
│   ├── App.jsx                            # Updated with new routes
│   └── main.jsx
```

## Features Implemented

### ✅ Complete Onboarding Flow (4 Steps)

**Step 1: Welcome Screen**
- Centered card with heading and subtext
- Progress bar showing 1 of 4
- Start button to proceed
- Clean, minimal SaaS-style design

**Step 2: Automation Selection**
- Multi-select cards for 4 automation types:
  - Complaint Handling
  - Query Answering
  - Order Tracking
  - Cancellation Requests
- Live preview panel showing selected automations
- Responsive grid layout (1-2 columns)
- Icons from lucide-react

**Step 3: Connect Channels**
- Two channel options: Gmail and WhatsApp
- Mock OAuth/connection flow (simulated with 2s delay)
- Visual feedback for connected/not connected status
- Success checkmarks on connected channels
- At least one channel required to proceed

**Step 4: Deploy**
- Loading animation with spinning robot emoji
- Three-step deployment progression:
  - Setting up automations...
  - Connecting channels...
  - Finalizing deployment...
- Auto-save to localStorage
- Automatic redirection to /dashboard after completion

### ✅ Routing

```
/ → Landing Page
/signup → Sign Up (with redirect to /onboarding on success)
/login → Login
/onboarding → Multi-step onboarding flow
/dashboard → Dashboard with sidebar
```

### ✅ State Management (Zustand)

Centralized store with persistence to localStorage:
- Current step tracking
- Selected automations
- Connected channels
- User information (name, email)
- Deployment progress tracking
- Actions for step navigation and data updates

### ✅ Dashboard Features

- **Sidebar Navigation**
  - My Automations
  - Channels
  - Settings
  - Logo and branding

- **Automations Section**
  - Displays all selected automations
  - Shows status (Active/Inactive)
  - Grid layout with 1-2 columns

- **Channels Section**
  - Shows all connected channels
  - Visual indicators for connection status
  - Gmail and WhatsApp icons

- **Settings Section**
  - Restart onboarding button
  - Reset everything (danger zone)
  - Confirmation dialog for destructive actions

### ✅ UI Components

Custom shadcn/ui-compatible components:
- **Button** - Multiple variants (primary, secondary, outline, ghost, destructive)
- **Card** - CardHeader, CardFooter, CardTitle, CardDescription, CardContent
- **Progress** - Smooth animated progress bar
- **Badge** - Colored badges with variants
- **Checkbox** - Custom checkbox with checkmark animation
- **Toast** - Toast notification system

### ✅ Animations & Transitions

- **Framer Motion**:
  - Smooth page transitions between steps
  - Loading spinner with scale animation
  - Deployment step progression
  - Card hover effects
  - Button animations

- **Tailwind Animations**:
  - Smooth transitions
  - Color changes
  - Border animations

### ✅ Styling

- **Tailwind CSS** - Responsive design with utility classes
- **Gradient backgrounds** - Modern SaaS-style gradients
- **Color scheme** - Blue primary, with success/warning/error variants
- **Responsive** - Mobile-first approach with Tailwind breakpoints
- **Dark mode ready** - Can be extended with Tailwind dark mode

## Tech Stack

- **React 19.2.0** - UI library
- **Vite 7.2.4** - Build tool
- **React Router 7.12.0** - Client-side routing
- **Zustand 5.0.12** - State management
- **Tailwind CSS 3.4.17** - Styling
- **Framer Motion 11.x** - Animations
- **Lucide React 0.563.0** - Icons
- **Radix UI** - Headless UI components (via @radix-ui packages)

## Getting Started

### Installation

```bash
cd frontend
npm install
```

### Running Development Server

```bash
npm run dev
```

Server will start at `http://localhost:5174/` (or next available port)

### Building for Production

```bash
npm run build
npm run preview
```

## Usage Flow

1. **User Signs Up**
   - Goes to /signup
   - Enters name, email, password
   - Submitted form redirects to /onboarding
   - User info is stored in Zustand store

2. **Onboarding Flow**
   - Step 1: Welcome introduction
   - Step 2: Select automation types
   - Step 3: Connect communication channels
   - Step 4: Mock deployment with auto-save to localStorage

3. **Dashboard Access**
   - After deployment completes, user is redirected to /dashboard
   - Can view selected automations
   - Can view connected channels
   - Can restart onboarding or reset configuration
   - Login/Logout functionality

## State Management Details

### Zustand Store (`store/onboardingStore.js`)

```javascript
// State
- currentStep: 1-4
- selectedAutomations: array of automation IDs
- connectedChannels: { gmail: boolean, whatsapp: boolean }
- userInfo: { name: string, email: string }
- isDeploying: boolean
- deploymentProgress: 0-100

// Actions
- setCurrentStep(step)
- toggleAutomation(automation)
- setConnectedChannels(channels)
- connectChannel(channel)
- setUserInfo(info)
- startDeployment()
- updateDeploymentProgress(progress)
- completeDeployment()
- resetOnboarding()
- saveOnboardingData()
```

### Persistence

Store is persisted to localStorage with key `onboarding-storage`, allowing:
- Step progress to survive page refresh
- User data to be retained
- Channel connections to persist

## Customization Guide

### Adding New Automations

Edit `Step2Automations.jsx`:

```javascript
const automationOptions = [
  {
    id: 'your_automation_id',
    label: 'Your Label',
    description: 'Your description',
    icon: YourIcon, // from lucide-react
  },
  // ...
];
```

### Adding New Channels

Edit `Step3Channels.jsx` and `Sidebar.jsx`:

```javascript
const channels = [
  {
    id: 'your_channel',
    label: 'Your Channel',
    icon: YourIcon,
    description: 'Connect your channel',
    color: 'bg-color-50 border-color-200',
  },
  // ...
];
```

### Styling Customization

- Primary colors: Modify `bg-blue-600` occurrences
- Spacing: Use Tailwind's padding, margin, gap utilities
- Border styles: Adjust `border-gray-200` and radius values
- Fonts: Configure in `tailwind.config.js`

### API Integration

Replace mock implementations in:
- `SignUp.jsx` - Connect to real signup endpoint
- `Step3Channels.jsx` - Connect to real OAuth endpoints
- `Step4Deploy.jsx` - Connect to real deployment API
- `Dashboard.jsx` - Connect to backend for data fetching

## Performance Optimization

- Lazy load images using Next.js Image component (for future)
- Optimize animations for 60fps
- Use React.memo for components if needed
- Code-split routes with React Router lazy loading

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android)

## Future Enhancements

1. Add dark mode with Tailwind
2. Add keyboard navigation
3. Implement multi-language support
4. Add real backend API integration
5. Add user profile page
6. Add analytics tracking
7. Add custom automation builder
8. Add webhook management
9. Add API key management
10. Add team/organization support

## Troubleshooting

### Port Already in Use
```bash
npm run dev -- --host 0.0.0.0 --port 3000
```

### State Not Persisting
- Check localStorage in browser DevTools
- Clear localStorage and retry: `localStorage.clear()`
- Check browser privacy settings

### Styles Not Loading
- Ensure `tailwindcss-animate` is installed: `npm install tailwindcss-animate`
- Check `index.css` imports Tailwind directives
- Rebuild with `npm run build`

### Build Errors
```bash
# Clear build cache
rm -rf .vite dist node_modules
npm install
npm run build
```

## Support & Contact

For issues or questions, check:
- React documentation: https://react.dev
- Vite documentation: https://vitejs.dev
- Zustand documentation: https://zustand-demo.vercel.app/
- Tailwind documentation: https://tailwindcss.com
- Framer Motion: https://www.framer.com/motion/

---

**Last Updated:** April 1, 2026
**Version:** 1.0.0
