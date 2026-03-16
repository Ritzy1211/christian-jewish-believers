async function loadProducts(category) {
  const res = await fetch('/data/products.json');
  const allProducts = await res.json();

  const products = allProducts.filter(p => p.category === category && p.approved);

  const container = document.getElementById('productList');
  container.innerHTML = products.length === 0
    ? '<p>No approved products in this category yet.</p>'
    : products.map(p => `
        <div class="border p-4 rounded shadow mb-4">
          <h3 class="text-xl font-bold">${p.productName}</h3>
          <p><strong>By:</strong> ${p.name} (${p.email})</p>
          <p><strong>Description:</strong> ${p.description}</p>
          <p><strong>Category:</strong> ${p.category}</p>
          <p><strong>Submitted:</strong> ${new Date(p.submittedAt).toLocaleString()}</p>
          ${p.image ? `<img src="${p.image}" class="w-48 mt-2 rounded border" />` : ''}
        </div>
      `).join('');
}