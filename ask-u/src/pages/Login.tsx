
const Login = () => {
  const handleGoogleLogin = () => {
    window.location.href = "https://ask-u-like.onrender.com/api/auth/google";
  };

  return (
    <div className="text-center mt-20">
      <h1 className="text-2xl font-bold">Ask U Like</h1>
      <button
        onClick={handleGoogleLogin}
        className="mt-5 px-4 py-2 bg-red-600 text-white rounded"
      >
        Sign in with Google
      </button>
    </div>
  );
};

export default Login;
