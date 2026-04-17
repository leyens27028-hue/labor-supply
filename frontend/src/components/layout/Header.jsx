import { MdMenu } from 'react-icons/md';
import './Header.css';

function Header({ title, onToggleSidebar }) {
  return (
    <header className="app-header">
      <button className="btn-menu" onClick={onToggleSidebar}>
        <MdMenu />
      </button>
      <h1 className="header-title">{title}</h1>
    </header>
  );
}

export default Header;
