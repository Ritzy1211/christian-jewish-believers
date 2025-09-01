async function loadBusinesses(category) {
  const res = await fetch(`/api/businesses/${category}`);
  const businesses = await res.json();

  const container = document.getElementById('businessList');
  if (!category) {
    container.innerHTML = '<p class="text-gray-600">Please select a category.</p>';
    return;
  }

  if (businesses.length === 0) {
    container.innerHTML = '<p class="text-red-600">No businesses found in this category yet.</p>';
    return;
  }

  container.innerHTML = businesses.map(b => `
    <div class="border p-4 rounded bg-white shadow">
      <h3 class="font-bold text-lg">${b.businessName} (${b.country})</h3>
      <p><strong>Email:</strong> ${b.email}</p>
      <p><strong>Description:</strong> ${b.description}</p>
    </div>
  `).join('');
}