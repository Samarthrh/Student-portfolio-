import { Link } from 'react-router-dom';

function NavBar() {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/projects">Tasks (JWT Auth)</Link>
      <Link to="/contact">Contact</Link>
    </nav>
  );
}

export default NavBar;