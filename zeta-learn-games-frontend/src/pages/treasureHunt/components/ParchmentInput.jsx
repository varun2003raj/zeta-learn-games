function ParchmentInput({ value, onChange, onSubmit, disabled, validation, placeholder }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(value);
  };

  return (
    <section className="parchment-input-box">
      <form className="parchment-form" onSubmit={handleSubmit}>
        <label htmlFor="pirate-answer">Code Input</label>
        <input
          id="pirate-answer"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          spellCheck="false"
        />
        <button type="submit" disabled={disabled}>Submit Code</button>
      </form>

      <p className={`validation validation-${validation.status}`}>{validation.message}</p>
    </section>
  );
}

export default ParchmentInput;
