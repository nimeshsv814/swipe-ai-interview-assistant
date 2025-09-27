// src/App.test.js (JavaScript version)
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import App from './App';

test('renders AI-Powered Interview Assistant', () => {
  render(
    <Provider store={store}>
      <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  );
  const linkElement = screen.getByText(/AI-Powered Interview Assistant/i);
  expect(linkElement).toBeInTheDocument();
});