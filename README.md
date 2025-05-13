# Train Ticket Admin Dashboard

A React-based admin dashboard for managing a train ticket booking system. This dashboard works alongside a Flutter mobile application that uses Firebase/Firestore.

## Tech Stack

- **React**: Frontend library for building the user interface
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Firebase/Firestore**: Backend and database
- **React Router**: For navigation and routing
- **Recharts**: For data visualization

## Features

- User authentication and protected routes
- Dashboard with key metrics and charts
- User management
- Ticket bookings management
- Train and route management
- Reports and analytics

## Setup Instructions

### Prerequisites

- Node.js and npm installed
- Firebase project with Firestore database

### Installation

1. Clone the repository
```
git clone <repository-url>
cd train-ticket-admin
```

2. Install dependencies
```
npm install
```

3. Configure Firebase
   - Update the Firebase configuration in `src/firebase.js` with your own Firebase project details

4. Run the development server
```
npm start
```

5. Build for production
```
npm run build
```

## Project Structure

```
train-ticket-admin/
├── public/                  # Public assets
├── src/
│   ├── components/          # Reusable components
│   │   ├── auth/            # Authentication components
│   │   ├── dashboard/       # Dashboard widgets
│   │   └── layout/          # Layout components
│   ├── contexts/            # React contexts
│   ├── hooks/               # Custom hooks
│   ├── pages/               # Page components
│   ├── styles/              # CSS styles
│   ├── utils/               # Utility functions
│   ├── App.js               # Main App component
│   ├── index.js             # Entry point
│   └── firebase.js          # Firebase configuration
└── package.json             # Project dependencies
```

## Connecting with Flutter App

This admin dashboard connects to the same Firebase/Firestore database as your Flutter mobile application. The dashboard provides administrative capabilities while the mobile app serves end-users.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
