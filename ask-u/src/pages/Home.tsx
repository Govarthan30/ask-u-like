const Home = () => {
  const loginWithGoogle = () => {
    window.location.href = "http://localhost:4000/api/auth/google";
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Ask U Like</h1>
      <button onClick={loginWithGoogle}>Sign in with Google</button>
    </div>
  );
};

export default Home;
