import "./App.css";
import Header from "./components/Header";
import About from "./components/About";
import Skills from "./components/skills";
import Footer from "./components/Footer";

function App() {
  const skills = ["Java","HTML", "CSS", "JavaScript"];

  return (
    <div className="container">
      <Header name="Samarth Rojara - D25IT129" />
      <About />
      <Skills skillList={skills} />
      <Footer />
    </div>
  );
}

export default App;