function Skills({ skillList }) {
  return (
    <section>
      <h2>My Skills</h2>
      <ul>
        {skillList.map((skill) => (
          <li key={skill}>{skill}</li>
        ))}
      </ul>
    </section>
  );
}

export default Skills;