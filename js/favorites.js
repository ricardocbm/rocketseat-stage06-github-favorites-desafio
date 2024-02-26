// Importação da classe GithubUser
import { GithubUser } from "./GithubUser.js";

// Definição da classe Favorites
export class Favorites {
  constructor(root) {
    this.root = document.querySelector(root);
    this.load();
  }

  // Carregar dados da localStorage
  load() {
    this.entries = JSON.parse(localStorage.getItem("@github-favorites:")) || [];
  }

  // Salvar dados na localStorage
  save() {
    localStorage.setItem("@github-favorites:", JSON.stringify(this.entries));
  }

  // Adicionar usuário favorito
  async add(username) {
    try {
      const userExists = this.entries.find((entry) => entry.login === username);

      if (userExists) {
        throw new Error("User already listed ");
      }

      const user = await GithubUser.search(username);

      if (user.login === undefined) {
        throw new Error("User not found");
      }
      this.entries = [user, ...this.entries];
      this.update();
      this.save();

      // Verifica se a lista de favoritos não está mais vazia
      if (this.entries.length !== 0) {
        // Se não estiver vazia, esconde a div com o texto explicativo
        document.getElementById("empty-message").style.display = "none";
      }
    } catch (error) {
      //alert(error.message);
      this.showErrorModal(error.message);
    }
  }

  // Remover usuário favorito
  delete(user) {
    const filteredEntries = this.entries.filter((entry) => {
      return entry.login !== user.login;
    });
    this.entries = filteredEntries;
    this.update();
    this.save();
  }

  showErrorModal(message) {
    const errorMessageElement = document.getElementById("errorMessage");
    errorMessageElement.textContent = message;
    const modal = document.getElementById("errorModal");
    modal.style.display = "block";

    // Fecha o modal quando clicar no botão de fechar
    const closeButton = document.getElementsByClassName("close")[0];
    closeButton.onclick = function () {
      modal.style.display = "none";
    };

    // Fecha o modal quando clicar fora dele
    window.onclick = function (event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    };
  }
}

// Definição da classe FavoritesView, que herda de Favorites
export class FavoritesView extends Favorites {
  constructor(root) {
    super(root);

    this.tbody = this.root.querySelector("table tbody");

    this.update();
    this.onAdd();

    // Adicionar evento de sugestões à barra de pesquisa
    const searchBar = this.root.querySelector("#input-search");

    // Adiciona evento de clique para cada sugestão na lista de sugestões
    const suggestionsList = document.getElementById("suggestions-list");
    suggestionsList.addEventListener("click", (event) => {
      const clickedSuggestion = event.target.textContent;
      searchBar.value = clickedSuggestion; // Preenche o valor do input com a sugestão clicada
      this.add(clickedSuggestion); // Adiciona o usuário automaticamente à lista de favoritos
      suggestionsList.innerHTML = ""; // Limpa a lista de sugestões
    });

    searchBar.addEventListener("input", async (event) => {
      const searchText = event.target.value;

      if (searchText.trim() === "") {
        // Se não houver texto na barra de pesquisa, esconder a lista de sugestões
        document.getElementById("suggestions-list").innerHTML = "";
        return;
      }

      const response = await fetch(
        `https://api.github.com/search/users?q=${searchText}`
      );
      const data = await response.json();
      const users = data.items.map((item) => item.login);

      const suggestionsList = document.getElementById("suggestions-list");
      suggestionsList.innerHTML = "";

      users.forEach((user) => {
        const listItem = document.createElement("li");
        listItem.textContent = user;
        listItem.addEventListener("click", () => {
          searchBar.value = user;
          suggestionsList.innerHTML = "";
        });
        suggestionsList.appendChild(listItem);
      });
    });

    // Adicionar evento de teclado para adicionar usuário ao pressionar Enter
    searchBar.addEventListener("keypress", async (event) => {
      if (event.key === "Enter") {
        const value = event.target.value.trim();
        if (value !== "") {
          // Adicionar usuário quando Enter for pressionado
          this.add(value);
          // Limpar o campo de pesquisa após adicionar o usuário
          searchBar.value = "";
          // Esconder a lista de sugestões
          document.getElementById("suggestions-list").innerHTML = "";
        }
      }
    });

    // Esconder a lista de sugestões quando clicar fora dela
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".search")) {
        document.getElementById("suggestions-list").innerHTML = "";
      }
    });

    // Adicionar a barra de rolagem à tabela
    this.adicionarBarraRolagem();
  }

  // Adicionar evento de clique no botão de adicionar
  onAdd() {
    const addButton = this.root.querySelector(".search button");
    const searchBarInput = this.root.querySelector(".search input");
    addButton.onclick = () => {
      const { value } = searchBarInput;

      this.add(value);

      // Limpar o campo de pesquisa após adicionar o usuário
      searchBarInput.value = "";
    };
  }

  // Atualizar visualização da tabela de favoritos
  update() {
    this.removeAllTr();

    // Verifica se a lista de favoritos está vazia
    if (this.entries.length === 0) {
      // Se estiver vazia, exibe a div com o texto explicativo
      document.getElementById("empty-message").style.display = "block";
    } else {
      // Se não estiver vazia, esconde a div
      document.getElementById("empty-message").style.display = "none";

      this.entries.forEach((user) => {
        const row = this.createRow();

        row.querySelector(
          ".user img"
        ).src = `https://github.com/${user.login}.png`;
        row.querySelector(".user img").alt = `Imagem de ${user.name}`;
        row.querySelector(".user a").href = `https://github.com/${user.login}`;
        row.querySelector(".user p").textContent = user.name;
        row.querySelector(".user span").textContent = user.login;
        row.querySelector(".repositories").textContent = user.public_repos;
        row.querySelector(".followers").textContent = user.followers;
        row.querySelector(".remove").onclick = () => {
          const isOk = confirm("Tem certeza que deseja deletar essa linha?");
          if (isOk) {
            this.delete(user);
          }
        };

        this.tbody.append(row);
      });
    }

    // Adicionar a barra de rolagem à tabela
    this.adicionarBarraRolagem();
  }

  // Criar nova linha na tabela
  createRow() {
    const tr = document.createElement("tr");

    tr.innerHTML = `   
    <td class="user">
      <img
        src="https://github.com/maykbrito.png"
        alt="Mayk Profile Picture"
      />
      <a href="https://github.com/maykbrito" target="_blank">
        <p>Mayk Brito</p>
        <span>maykbrito</span>
      </a>
    </td>
    <td class="repositories">76</td>
    <td class="followers">9589</td>
    <td class="remove">
      <button class="remove">Remove</button>
    </td> 
    `;

    return tr;
  }

  // Remover todas as linhas da tabela
  removeAllTr() {
    this.tbody.querySelectorAll("tr").forEach((tr) => {
      tr.remove();
    });
  }

  // Adicionar barra de rolagem ao corpo da tabela
  // Adicionar barra de rolagem ao corpo da tabela
  adicionarBarraRolagem() {
    const tbody = this.tbody;
    tbody.style.overflowY = "scroll";
    tbody.style.maxHeight = "400px"; // Defina a altura máxima desejada em pixels
  }
}
