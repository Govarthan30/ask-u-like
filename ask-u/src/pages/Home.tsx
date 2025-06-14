const Home = () => {
  const loginWithGoogle = () => {
    window.location.href = "https://ask-u-like.onrender.com/api/auth/google";
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Ask U Like</h1>
      <button onClick={loginWithGoogle}>Sign in with Google</button>
    </div>
  );
};

export default Home;
