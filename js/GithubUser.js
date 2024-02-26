// Definição da classe GithubUser
export class GithubUser {
  // Método estático para buscar usuário no Github
  static search(username) {
    const endpoint = `https://api.github.com/users/${username}`;

    return fetch(endpoint)
      .then((data) => data.json())
      .then(({ login, name, public_repos, followers }) => ({
        login,
        name,
        public_repos,
        followers,
      }));
  }
}
