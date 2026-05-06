import { appConfig } from '../config/appConfig';

export function AppHeader({ title, subtitle }) {
  return (
    <header className="screen-header">
      <p className="brand">{appConfig.appName}</p>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  );
}
