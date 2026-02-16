/* ===============================
   SIMS - Stock Inventory System
   =============================== */

const USERS_KEY = "sims_users";
const LOGIN_KEY = "sims_logged_user";
const PRODUCTS_KEY = "sims_products";

/* ===============================
   Utility Functions
   =============================== */

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getProducts() {
  return JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || [];
}

function saveProducts(products) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

function getLoggedUser() {
  return JSON.parse(localStorage.getItem(LOGIN_KEY));
}

/* ===============================
   REGISTER
   =============================== */

const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const message = document.getElementById("registerMessage");

    message.textContent = "";

    if (!fullName || !email || !password || !confirmPassword) {
      message.textContent = "All fields are required.";
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      message.textContent = "Invalid email format.";
      return;
    }

    const users = getUsers();
    if (users.some(user => user.email === email)) {
      message.textContent = "Email already registered.";
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      message.textContent =
        "Password must be at least 8 characters and include uppercase, lowercase and a number.";
      return;
    }

    if (password !== confirmPassword) {
      message.textContent = "Passwords do not match.";
      return;
    }

    users.push({ fullName, email, password });
    saveUsers(users);

    window.location.href = "login.html";
  });
}

/* ===============================
   LOGIN
   =============================== */

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const message = document.getElementById("loginMessage");

    message.textContent = "";

    if (!email || !password) {
      message.textContent = "All fields are required.";
      return;
    }

    const user = getUsers().find(
      user => user.email === email && user.password === password
    );

    if (!user) {
      message.textContent = "Invalid email or password.";
      return;
    }

    localStorage.setItem(LOGIN_KEY, JSON.stringify(user));
    window.location.href = "dashboard.html";
  });
}

/* ===============================
   AUTHORIZATION CHECK
   =============================== */

if (window.location.pathname.includes("dashboard.html")) {
  const loggedUser = getLoggedUser();

  if (!loggedUser) {
    window.location.href = "login.html";
  } else {
    const userDisplay = document.getElementById("userDisplay");
    if (userDisplay) {
      userDisplay.textContent = "Welcome, " + loggedUser.fullName;
    }
    loadProducts();
  }
}

/* ===============================
   LOGOUT
   =============================== */

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", function () {
    localStorage.removeItem(LOGIN_KEY);
    window.location.href = "login.html";
  });
}

/* ===============================
   PRODUCT SYSTEM
   =============================== */

const productForm = document.getElementById("productForm");
const addBtn = document.getElementById("addBtn");

if (addBtn) {
  addBtn.addEventListener("click", function () {
    productForm.classList.toggle("hidden");
  });
}

if (productForm) {
  productForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("productName").value.trim();
    const category = document.getElementById("category").value.trim();
    const quantity = parseFloat(document.getElementById("quantity").value);
    const price = parseFloat(document.getElementById("price").value);
    const editIndex = document.getElementById("editIndex").value;
    const message = document.getElementById("productMessage");

    message.textContent = "";

    if (!name || !category || isNaN(quantity) || isNaN(price)) {
      message.textContent = "All fields are required.";
      return;
    }

    if (quantity < 0) {
      message.textContent = "Quantity cannot be negative.";
      return;
    }

    const products = getProducts();

    if (editIndex === "") {
      products.push({
        id: Date.now(),
        name,
        category,
        quantity,
        price
      });
    } else {
      products[editIndex] = {
        id: products[editIndex].id,
        name,
        category,
        quantity,
        price
      };
    }

    saveProducts(products);
    productForm.reset();
    document.getElementById("editIndex").value = "";
    productForm.classList.add("hidden");

    loadProducts();
  });
}

/* ===============================
   LOAD PRODUCTS
   =============================== */

function loadProducts() {
  const products = getProducts();
  const table = document.getElementById("productTable");
  const emptyState = document.getElementById("emptyState");

  if (!table) return;

  table.innerHTML = "";

  if (products.length === 0) {
    emptyState.style.display = "block";
  } else {
    emptyState.style.display = "none";
  }

  let inStock = 0;
  let outStock = 0;

  products.forEach((product, index) => {
    const status =
      product.quantity > 0 ? "In Stock" : "Out of Stock";

    if (product.quantity > 0) inStock++;
    else outStock++;

    const row = `
      <tr>
        <td>${index + 1}</td>
        <td>${product.name}</td>
        <td>${product.category}</td>
        <td>${product.quantity} kg</td>
        <td>$${product.price}</td>
        <td>${status}</td>
        <td>
          <button onclick="editProduct(${index})">Edit</button>
          <button onclick="deleteProduct(${index})">Delete</button>
        </td>
      </tr>
    `;

    table.innerHTML += row;
  });

  document.getElementById("totalProducts").textContent = products.length;
  document.getElementById("inStock").textContent = inStock;
  document.getElementById("outStock").textContent = outStock;
}

/* ===============================
   EDIT & DELETE
   =============================== */

function editProduct(index) {
  const product = getProducts()[index];

  document.getElementById("productName").value = product.name;
  document.getElementById("category").value = product.category;
  document.getElementById("quantity").value = product.quantity;
  document.getElementById("price").value = product.price;
  document.getElementById("editIndex").value = index;

  productForm.classList.remove("hidden");
}

function deleteProduct(index) {
  const products = getProducts();
  products.splice(index, 1);
  saveProducts(products);
  loadProducts();
}
