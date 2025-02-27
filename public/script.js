let currentSessionUser = null;
let darkModeEnabled = false;

document.addEventListener("DOMContentLoaded", async () => {
  await loadSharedNav();
  checkDarkModePreference();
  checkAuthStatus();
  setupGlobalSearch();
  setupSignInModal();
  setupSignUpModalMultiStep();
  setupProfileModal();
  handleCreateListingForm();
  handleDetailPage();
  setupDarkModeToggle();
  loadMicrojobs();
  setupProfilePage();
});

async function loadSharedNav() {
  let navContainer = document.getElementById("sharedNav");
  if (!navContainer) return;
  let resp = await fetch("nav.html");
  let html = await resp.text();
  navContainer.innerHTML = html;
}

function setupProfilePage() {
  if (!window.location.pathname.endsWith("profile.html")) return;
  let editBtn = document.getElementById("openEditProfile");
  let profilePic = document.getElementById("profilePic");
  let displayNameEl = document.getElementById("profileDisplayName");
  let descEl = document.getElementById("profileDesc");
  let locEl = document.getElementById("profileLocation");
  let zipEl = document.getElementById("profileZip");
  let emailEl = document.getElementById("profileEmail");
  let phoneEl = document.getElementById("profilePhone");
  let websiteEl = document.getElementById("profileWebsite");

  fetch("/api/auth/me", { credentials: "include" })
    .then(r => r.json())
    .then(d => {
      if (!d.user) {
        window.location.href = "index.html";
        return;
      }
      let data = d.user;
      if (data.pic && profilePic) profilePic.src = data.pic;
      if (displayNameEl) displayNameEl.textContent = data.displayName || data.username;
      if (descEl) descEl.textContent = data.description || "";
      if (locEl) locEl.textContent = data.location ? "Location: " + data.location : "";
      if (zipEl) zipEl.textContent = data.zip ? "Zip: " + data.zip : "";
      if (emailEl) emailEl.textContent = data.email ? "Email: " + data.email : "";
      if (phoneEl) phoneEl.textContent = data.phone ? "Phone: " + data.phone : "";
      if (websiteEl) websiteEl.textContent = data.website ? "Website: " + data.website : "";
    });

  if (editBtn) {
    editBtn.onclick = () => {
      openEditProfile();
    };
  }
}

function checkDarkModePreference() {
  fetch("/api/darkmode", { credentials: "include" })
    .then(r => r.json())
    .then(d => {
      if (d.enabled) {
        darkModeEnabled = true;
        document.body.classList.add("dark-mode");
        document.body.classList.remove("light-mode");
      }
    });
}

function setupDarkModeToggle() {
  let btn = document.getElementById("darkModeToggle");
  if (!btn) return;
  btn.onclick = () => {
    darkModeEnabled = !darkModeEnabled;
    if (darkModeEnabled) {
      document.body.classList.add("dark-mode");
      document.body.classList.remove("light-mode");
    } else {
      document.body.classList.remove("dark-mode");
      document.body.classList.add("light-mode");
    }
    fetch("/api/darkmode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ enabled: darkModeEnabled })
    });
  };
}

function checkAuthStatus() {
  fetch("/api/auth/status", { credentials: "include" })
    .then(r => r.json())
    .then(d => {
      if (d.authenticated) {
        currentSessionUser = d.user;
        showLoggedInUI();
        if (document.getElementById("filterBar")) {
          document.getElementById("filterBar").style.display = "flex";
          loadAndRenderListings();
        }
        showRecommendations();
        showProfileCompleteness();
        showAIProposalsSection();
        showLiveBiddingSection();
        showEscrowSection();
        showSkillVerification();
        showRatingsSystem();
        showTimeTracking();
        showChatVideo();
        showMilestoneTracking();
        showGamification();
      } else {
        currentSessionUser = null;
        showLoggedOutUI();
      }
    });
}

function showLoggedInUI() {
  let signInBtn = document.getElementById("signInBtn");
  let signUpBtn = document.getElementById("signUpBtn");
  let editProfileBtn = document.getElementById("editProfileBtn");
  let signOutBtn = document.getElementById("signOutBtn");
  let createListingLink = document.getElementById("createListingLink");
  let contactSection = document.getElementById("contactSection");
  let findMoreSection = document.getElementById("findMoreSection");
  let recommendationsSection = document.getElementById("recommendationsSection");
  let profileCompletenessSection = document.getElementById("profileCompletenessSection");
  let profileLink = document.getElementById("profileLink");
  if (signInBtn) signInBtn.style.display = "none";
  if (signUpBtn) signUpBtn.style.display = "none";
  if (editProfileBtn) editProfileBtn.style.display = "inline-flex";
  if (signOutBtn) signOutBtn.style.display = "inline-flex";
  if (createListingLink) createListingLink.style.display = "inline-block";
  if (contactSection) contactSection.style.display = "block";
  if (findMoreSection) findMoreSection.style.display = "block";
  if (recommendationsSection) recommendationsSection.style.display = "block";
  if (profileCompletenessSection) profileCompletenessSection.style.display = "block";
  if (profileLink) profileLink.style.display = "inline";
  renderUserCard();
  if (signOutBtn) {
    signOutBtn.onclick = () => {
      fetch("/api/auth/logout", { method: "POST", credentials: "include" })
        .then(() => {
          window.location.reload();
        });
    };
  }
  if (editProfileBtn) {
    editProfileBtn.onclick = () => {
      openEditProfile();
    };
  }
}

function showLoggedOutUI() {
  let signInBtn = document.getElementById("signInBtn");
  let signUpBtn = document.getElementById("signUpBtn");
  let editProfileBtn = document.getElementById("editProfileBtn");
  let signOutBtn = document.getElementById("signOutBtn");
  let createListingLink = document.getElementById("createListingLink");
  let contactSection = document.getElementById("contactSection");
  let findMoreSection = document.getElementById("findMoreSection");
  let recommendationsSection = document.getElementById("recommendationsSection");
  let profileCompletenessSection = document.getElementById("profileCompletenessSection");
  let profileLink = document.getElementById("profileLink");
  if (signInBtn) {
    signInBtn.style.display = "inline-flex";
    signInBtn.onclick = () => showSignInModal();
  }
  if (signUpBtn) {
    signUpBtn.style.display = "inline-flex";
    signUpBtn.onclick = () => showSignUpModalMultiStep();
  }
  if (editProfileBtn) editProfileBtn.style.display = "none";
  if (signOutBtn) signOutBtn.style.display = "none";
  if (createListingLink) createListingLink.style.display = "none";
  if (contactSection) contactSection.style.display = "none";
  if (findMoreSection) findMoreSection.style.display = "none";
  if (recommendationsSection) recommendationsSection.style.display = "none";
  if (profileCompletenessSection) profileCompletenessSection.style.display = "none";
  if (profileLink) profileLink.style.display = "none";
  if (document.getElementById("filterBar")) {
    document.getElementById("filterBar").style.display = "none";
  }
}

function loadAndRenderListings() {
  fetch("/api/listings")
    .then(r => r.json())
    .then(list => {
      setupLiveFilters(list);
      renderListings(list);
    });
}

function setupLiveFilters(list) {
  let cat = document.getElementById("categoryFilter");
  let loc = document.getElementById("locationFilter");
  let tpe = document.getElementById("typeFilter");
  let sort = document.getElementById("sortFilter");
  let s = document.getElementById("searchInput");
  [cat, loc, tpe, sort, s].forEach(el => {
    if (!el) return;
    el.addEventListener("change", () => renderListings(filterListings(list)));
    el.addEventListener("keyup", () => renderListings(filterListings(list)));
  });
}

function filterListings(all) {
  let cat = document.getElementById("categoryFilter").value;
  let loc = document.getElementById("locationFilter").value;
  let tpe = document.getElementById("typeFilter").value;
  let sortVal = document.getElementById("sortFilter").value;
  let searchVal = document.getElementById("searchInput").value.toLowerCase();
  let f = all.filter(i => {
    if (cat && i.category !== cat) return false;
    if (loc && i.location.toLowerCase() !== loc.toLowerCase()) return false;
    if (tpe && i.type !== tpe) return false;
    if (searchVal && !i.title.toLowerCase().includes(searchVal)) return false;
    return true;
  });
  f.sort((a, b) => {
    if (sortVal === "asc") return b.createdAt - a.createdAt;
    return a.createdAt - b.createdAt;
  });
  return f;
}

function renderListings(list) {
  let c = document.getElementById("jobListings");
  if (!c) return;
  c.innerHTML = "";
  list.forEach(i => {
    let card = document.createElement("div");
    card.className = "job-card";
    let badge = document.createElement("span");
    badge.className = "category-badge category-" + i.category.replace(/\s/g, "\\ ");
    badge.textContent = i.category;
    let titleEl = document.createElement("h2");
    titleEl.className = "job-title";
    titleEl.textContent = i.title;

    let meta = document.createElement("div");
    meta.className = "job-meta";

    let lines = [];
    if (i.logo) lines.push(`<img class="listing-logo" src="${i.logo}" alt="Company Logo">`);
    if (i.price) lines.push(`<p style="color:#79c0ff;font-weight:bold;">${i.price}</p>`);

    lines.push(`<p>${i.location}</p>`);
    if (i.zipCode) lines.push(`<p>Zip: ${i.zipCode}</p>`);

    if (i.duration) {
      let durColor = getDurationColor(i.duration);
      lines.push(`<p style="color:${durColor};font-weight:bold;">Estimated Duration: ${i.duration}</p>`);
    }

    if (i.appliedCapacity) {
      let ac = i.appliedCapacity.split("/");
      if (ac.length === 2) {
        let applied = parseInt(ac[0]) || 0;
        let total = parseInt(ac[1]) || 1;
        let percent = Math.floor((applied / total) * 100);
        lines.push(`<div style="margin:0.5rem 0;">${applied} Applied of ${total} capacity</div>`);
        lines.push(`
          <div class="progress" style="height:6px;">
            <div class="progress-bar bg-danger" style="width:${percent}%;"></div>
          </div>
        `);
      }
    }

    lines.push(`<p>${i.type}</p>`);
    lines.push(`<p>${timeDiffString(i.createdAt)} ago</p>`);
    lines.push(`<p class="company-name">${i.company}</p>`);
    if (i.phone) lines.push(`<p>Phone: ${i.phone}</p>`);
    if (i.email) lines.push(`<p>Email: <a href="mailto:${i.email}">${i.email}</a></p>`);
    if (i.contact) lines.push(`<p>Contact: ${i.contact}</p>`);

    meta.innerHTML = lines.join("");
    let link = document.createElement("a");
    link.className = "view-info-btn";
    link.href = `detail.html?id=${i.id}`;
    link.textContent = "View Info";

    card.appendChild(badge);
    card.appendChild(titleEl);
    card.appendChild(meta);
    card.appendChild(link);
    c.appendChild(card);
  });
}

function getDurationColor(dur) {
  let d = dur.toLowerCase();
  if (d.includes("month")) {
    let num = parseInt(d) || 0;
    if (num >= 4) return "red";
    return "orange";
  }
  if (d.includes("week")) {
    let num = parseInt(d) || 0;
    if (num > 3) return "orange";
    return "green";
  }
  return "gray";
}

function timeDiffString(createdAt) {
  let now = Date.now();
  let diff = Math.floor((now - createdAt) / (1000 * 60 * 60));
  return diff < 1 ? "<1h" : diff + "h";
}

function setupGlobalSearch() {
  let btn = document.getElementById("globalSearchBtn");
  if (!btn) return;
  btn.onclick = () => {
    let q = document.getElementById("globalSearchInput").value.trim();
    let zip = document.getElementById("zipCodeInput").value.trim();
    let type = document.getElementById("searchTypeSelect").value;
    if (!q && !zip) {
      let sec = document.getElementById("searchResultsSection");
      if (sec) sec.style.display = "none";
      return;
    }
    fetch(`/api/search?type=${encodeURIComponent(type)}&q=${encodeURIComponent(q)}&zip=${encodeURIComponent(zip)}`)
      .then(r => r.json())
      .then(d => {
        renderSearchResults(d, type);
      });
  };
}

function renderSearchResults(data, type) {
  let sec = document.getElementById("searchResultsSection");
  let container = document.getElementById("searchResultsContainer");
  let title = document.getElementById("searchResultsTitle");
  if (!sec || !container || !title) return;
  sec.style.display = "block";
  container.innerHTML = "";
  title.textContent = "Search Results for " + (type === "jobs" ? "Jobs" : "Freelancers");
  data.forEach(item => {
    let div = document.createElement("div");
    div.className = "search-item";
    if (type === "jobs") {
      div.innerHTML = `
        <h3>${item.title}</h3>
        <p>Location: ${item.location}</p>
        <p>Zip Code: ${item.zipCode || ""}</p>
        <p>Company: ${item.company}</p>
        <p>Category: ${item.category}</p>
        <p>${timeDiffString(item.createdAt)} ago</p>
      `;
    } else {
      div.innerHTML = `
        <h3>${item.displayName || item.username}</h3>
        <p>Location: ${item.location || ""}</p>
        <p>Zip Code: ${item.zip || ""}</p>
        <p>Email: <a href="mailto:${item.email}">${item.email}</a></p>
        <p>${item.description || ""}</p>
      `;
    }
    container.appendChild(div);
  });
}

function showSignInModal() {
  let modal = document.getElementById("loginModal");
  if (!modal) return;
  modal.style.display = "flex";
}

function setupSignInModal() {
  let modal = document.getElementById("loginModal");
  let cancelBtn = document.getElementById("loginCancelBtn");
  let submitBtn = document.getElementById("loginSubmitBtn");
  if (!modal || !cancelBtn || !submitBtn) return;
  cancelBtn.onclick = () => {
    modal.style.display = "none";
  };
  submitBtn.onclick = () => {
    let uname = document.getElementById("loginUser").value.trim();
    let pass = document.getElementById("loginPass").value.trim();
    if (!uname || !pass) {
      alert("Enter username and password.");
      return;
    }
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username: uname, password: pass })
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          modal.style.display = "none";
          window.location.reload();
        } else {
          alert(d.message || "Login failed.");
        }
      });
  };
}

function setupSignUpModalMultiStep() {
  let modal = document.getElementById("signupModal");
  if (!modal) return;
  let step1 = document.getElementById("signupStep1");
  let step2 = document.getElementById("signupStep2");
  let step3 = document.getElementById("signupStep3");
  let step4 = document.getElementById("signupStep4");
  if (!step1 || !step2 || !step3 || !step4) return;

  let cancelBtn = document.getElementById("signupCancelBtn");
  let nextBtn1 = document.getElementById("signupNextBtn1");
  let nextBtn2 = document.getElementById("signupNextBtn2");
  let nextBtn3 = document.getElementById("signupNextBtn3");
  let backBtn2 = document.getElementById("signupBackBtn2");
  let backBtn3 = document.getElementById("signupBackBtn3");
  let backBtn4 = document.getElementById("signupBackBtn4");
  let submitBtn = document.getElementById("signupSubmitBtn");

  let userPicDrop = document.getElementById("userPicDrop");
  let userPicFile = document.getElementById("userPicFile");
  let userPicPreview = document.getElementById("userPicPreview");

  let signUpBtn = document.getElementById("signUpBtn");
  if (signUpBtn) {
    signUpBtn.onclick = () => {
      modal.style.display = "flex";
      step1.style.display = "block";
      step2.style.display = "none";
      step3.style.display = "none";
      step4.style.display = "none";
      step1.style.opacity = 1;
      step2.style.opacity = 0;
      step3.style.opacity = 0;
      step4.style.opacity = 0;
    };
  }

  cancelBtn.onclick = () => {
    modal.style.display = "none";
  };

  nextBtn1.onclick = () => {
    fadeStep(step1, step2);
  };
  nextBtn2.onclick = () => {
    fadeStep(step2, step3);
  };
  nextBtn3.onclick = () => {
    fadeStep(step3, step4);
  };
  backBtn2.onclick = () => {
    fadeStep(step2, step1);
  };
  backBtn3.onclick = () => {
    fadeStep(step3, step2);
  };
  backBtn4.onclick = () => {
    fadeStep(step4, step3);
  };

  submitBtn.onclick = () => {
    let uname = document.getElementById("signupUser").value.trim();
    let pass = document.getElementById("signupPass").value.trim();
    let n = document.getElementById("userName").value.trim();
    let e = document.getElementById("userEmail").value.trim();
    let ph = document.getElementById("userPhone").value.trim();
    let loc = document.getElementById("userLocation").value.trim();
    let zip = document.getElementById("userZip").value.trim();
    let w = document.getElementById("userWebsite").value.trim();
    let d = document.getElementById("userDesc").value.trim();
    let pic = userPicPreview.src || "";

    if (!uname || !pass) {
      alert("Username and password required.");
      return;
    }
    fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        username: uname,
        password: pass,
        displayName: n,
        email: e,
        phone: ph,
        location: loc,
        zip: zip,
        website: w,
        description: d,
        pic: pic
      })
    })
      .then(r => r.json())
      .then(dd => {
        if (dd.success) {
          modal.style.display = "none";
          window.location.reload();
        } else {
          alert(dd.message || "Registration failed.");
        }
      });
  };

  if (userPicDrop && userPicFile && userPicPreview) {
    userPicDrop.addEventListener("click", () => userPicFile.click());
    userPicFile.addEventListener("change", e => {
      handlePicFiles(e.target.files, userPicPreview);
    });
    userPicDrop.addEventListener("dragover", e => {
      e.preventDefault();
      userPicDrop.classList.add("dragover");
    });
    userPicDrop.addEventListener("dragleave", () => {
      userPicDrop.classList.remove("dragover");
    });
    userPicDrop.addEventListener("drop", e => {
      e.preventDefault();
      userPicDrop.classList.remove("dragover");
      if (e.dataTransfer.files && e.dataTransfer.files.length) {
        handlePicFiles(e.dataTransfer.files, userPicPreview);
      }
    });
  }
}

function fadeStep(fromStep, toStep) {
  fromStep.style.opacity = 1;
  let fadeOut = setInterval(() => {
    if (fromStep.style.opacity > 0) {
      fromStep.style.opacity -= 0.1;
    } else {
      clearInterval(fadeOut);
      fromStep.style.display = "none";
      toStep.style.display = "block";
      toStep.style.opacity = 0;
      let fadeIn = setInterval(() => {
        if (parseFloat(toStep.style.opacity) < 1) {
          toStep.style.opacity = (parseFloat(toStep.style.opacity) + 0.1).toString();
        } else {
          clearInterval(fadeIn);
        }
      }, 30);
    }
  }, 30);
}

function setupProfileModal() {
  let modal = document.getElementById("editProfileModal");
  let cancelBtn = document.getElementById("editCancelBtn");
  let submitBtn = document.getElementById("editSubmitBtn");
  if (!modal || !cancelBtn || !submitBtn) return;
  cancelBtn.onclick = () => {
    modal.style.display = "none";
  };
  submitBtn.onclick = () => {
    let n = document.getElementById("editName").value.trim();
    let e = document.getElementById("editEmail").value.trim();
    let ph = document.getElementById("editPhone").value.trim();
    let loc = document.getElementById("editLocation").value.trim();
    let zip = document.getElementById("editZip").value.trim();
    let w = document.getElementById("editWebsite").value.trim();
    let d = document.getElementById("editDesc").value.trim();
    let pic = document.getElementById("editPicPreview").src || "";
    fetch("/api/auth/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ displayName: n, email: e, phone: ph, location: loc, zip: zip, website: w, description: d, pic: pic })
    })
      .then(r => r.json())
      .then(dd => {
        if (dd.success) {
          modal.style.display = "none";
          renderUserCard();
          showProfileCompleteness();
          if (window.location.pathname.endsWith("profile.html")) {
            window.location.reload();
          }
        } else {
          alert(dd.message || "Update failed.");
        }
      });
  };
  setupUserPicDrop("editPicDrop", "editPicFile", "editPicPreview");
}

function openEditProfile() {
  let modal = document.getElementById("editProfileModal");
  if (!modal) return;
  fetch("/api/auth/me", { credentials: "include" })
    .then(r => r.json())
    .then(d => {
      if (!d.user) return;
      document.getElementById("editName").value = d.user.displayName || "";
      document.getElementById("editEmail").value = d.user.email || "";
      document.getElementById("editPhone").value = d.user.phone || "";
      document.getElementById("editLocation").value = d.user.location || "";
      document.getElementById("editZip").value = d.user.zip || "";
      document.getElementById("editWebsite").value = d.user.website || "";
      document.getElementById("editDesc").value = d.user.description || "";
      let prev = document.getElementById("editPicPreview");
      if (d.user.pic) {
        prev.src = d.user.pic;
        prev.style.display = "block";
      } else {
        prev.src = "";
        prev.style.display = "none";
      }
      modal.style.display = "flex";
    });
}

function renderUserCard() {
  let c = document.getElementById("contactCardContainer");
  if (!c) return;
  c.innerHTML = "";
  if (!currentSessionUser) return;
  fetch("/api/auth/me", { credentials: "include" })
    .then(r => r.json())
    .then(d => {
      if (!d.user) return;
      let data = d.user;
      let div = document.createElement("div");
      div.className = "contact-card";
      div.innerHTML = `
        <img class="contact-pic" src="${data.pic || "/pfp.png"}" alt="Profile Pic">
        <h3>${data.displayName || data.username}</h3>
        <p class="contact-title">${data.description || ""}</p>
        ${data.website ? `<p><a href="${data.website}" target="_blank">Website</a></p>` : ""}
        ${data.email ? `<p>Email: <a href="mailto:${data.email}">${data.email}</a></p>` : ""}
        ${data.phone ? `<p>Phone: ${data.phone}</p>` : ""}
        ${data.location ? `<p>Location: ${data.location}</p>` : ""}
        ${data.zip ? `<p>Zip Code: ${data.zip}</p>` : ""}
      `;
      c.appendChild(div);
    });
}

function handleCreateListingForm() {
  if (!window.location.pathname.endsWith("create-listing.html")) return;
  let form = document.getElementById("createListingForm");
  if (!form) return;
  form.addEventListener("submit", e => {
    e.preventDefault();
    let newItem = {
      title: document.getElementById("listingTitle").value.trim(),
      category: document.getElementById("listingCategory").value,
      location: document.getElementById("listingLocation").value,
      zipCode: document.getElementById("listingZip").value.trim() || "",
      type: document.getElementById("listingType").value,
      duration: document.getElementById("listingDuration").value.trim() || "",
      price: document.getElementById("listingPrice").value.trim() || "",
      company: document.getElementById("listingCompany").value.trim(),
      phone: document.getElementById("listingPhone").value.trim(),
      email: document.getElementById("listingEmail").value.trim(),
      contact: document.getElementById("listingContact").value.trim() || "",
      appliedCapacity: document.getElementById("listingAppliedCapacity").value.trim() || "",
      logo: document.getElementById("companyLogoPreview").src || "",
      description: document.getElementById("listingDescription").value.trim()
    };
    fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(newItem)
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          alert("Listing created!");
          window.location.href = "index.html";
        } else {
          alert(d.message || "Failed to create listing.");
        }
      });
  });
  let logoArea = document.getElementById("companyLogoDropArea");
  let logoFile = document.getElementById("companyLogoFile");
  let logoPreview = document.getElementById("companyLogoPreview");
  if (logoArea && logoFile && logoPreview) {
    logoArea.addEventListener("click", () => logoFile.click());
    logoFile.addEventListener("change", e => handlePicFiles(e.target.files, logoPreview));
    logoArea.addEventListener("dragover", e => {
      e.preventDefault();
      logoArea.classList.add("dragover");
    });
    logoArea.addEventListener("dragleave", () => {
      logoArea.classList.remove("dragover");
    });
    logoArea.addEventListener("drop", e => {
      e.preventDefault();
      logoArea.classList.remove("dragover");
      if (e.dataTransfer.files && e.dataTransfer.files.length) {
        handlePicFiles(e.dataTransfer.files, logoPreview);
      }
    });
  }
}

function handleDetailPage() {
  if (!window.location.pathname.endsWith("detail.html")) return;
  let params = new URLSearchParams(window.location.search);
  let id = params.get("id");
  if (!id) return;
  fetch("/api/listings/" + encodeURIComponent(id))
    .then(r => r.json())
    .then(d => {
      let detail = document.getElementById("listingDetail");
      let actions = document.getElementById("detailActions");
      if (!detail) return;
      if (!d.id) {
        detail.innerHTML = "<p>Listing not found.</p>";
        if (actions) actions.style.display = "none";
        return;
      }
      let html = `<h2>${d.title}</h2><h3>${d.category}</h3>`;
      if (d.price) html += `<p style="color:#79c0ff;font-weight:bold;">Price Range: ${d.price}</p>`;
      html += `<p><strong>Location:</strong> ${d.location}</p>`;
      if (d.zipCode) html += `<p><strong>Zip Code:</strong> ${d.zipCode}</p>`;
      if (d.duration) {
        let durColor = getDurationColor(d.duration);
        html += `<p><strong style="color:${durColor};">Estimated Duration:</strong> ${d.duration}</p>`;
      }
      html += `<p><strong>Contract:</strong> ${d.type}</p>`;
      html += `<p><strong>Posted:</strong> ${timeDiffString(d.createdAt)} ago</p>`;
      html += `<p><strong>Company:</strong> ${d.company}</p>`;
      if (d.appliedCapacity) {
        let ac = d.appliedCapacity.split("/");
        if (ac.length === 2) {
          let applied = parseInt(ac[0]) || 0;
          let total = parseInt(ac[1]) || 1;
          let percent = Math.floor((applied / total) * 100);
          html += `<p>${applied} Applied of ${total} capacity</p>`;
          html += `
            <div class="progress" style="height:6px;max-width:200px;">
              <div class="progress-bar bg-danger" style="width:${percent}%;"></div>
            </div>
          `;
        }
      }
      if (d.logo) html += `<p><img class="listing-logo" src="${d.logo}" alt="Logo"></p>`;
      if (d.phone) html += `<p><strong>Phone:</strong> ${d.phone}</p>`;
      if (d.email) html += `<p><strong>Email:</strong> <a href="mailto:${d.email}">${d.email}</a></p>`;
      if (d.contact) html += `<p><strong>Other Contact:</strong> ${d.contact}</p>`;
      html += `<p><strong>Description:</strong><br>${d.description || "No description."}</p>`;
      detail.innerHTML = html;
      if (actions && currentSessionUser) {
        actions.style.display = "flex";
        let likeBtn = document.getElementById("likeListingBtn");
        let applyBtn = document.getElementById("applyListingBtn");
        let likesCount = document.getElementById("listingLikesCount");
        let proposalBtn = document.getElementById("generateProposalBtn");
        likesCount.textContent = `Likes: ${d.likes || 0}`;
        likeBtn.onclick = () => {
          fetch("/api/listings/" + encodeURIComponent(d.id) + "/like", {
            method: "POST",
            credentials: "include"
          })
            .then(r => r.json())
            .then(rr => {
              likesCount.textContent = `Likes: ${rr.likes}`;
            });
        };
        applyBtn.onclick = () => {
          alert("Application process started! (In a real app, you'd handle this properly.)");
        };
        if (proposalBtn) {
          proposalBtn.style.display = "inline-block";
          proposalBtn.onclick = () => {
            fetch("/api/ai-proposal", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ listingTitle: d.title, listingDesc: d.description || "" })
            })
              .then(r => r.json())
              .then(resp => {
                let section = document.getElementById("proposalOutputSection");
                if (!section) return;
                section.style.display = "block";
                document.getElementById("proposalContent").innerText = resp.proposal || "No proposal generated.";
              });
          };
        }
      }
    });
}

function loadMicrojobs() {
  let microjobsContainer = document.getElementById("microjobsContainer");
  if (!microjobsContainer) return;
  fetch("/api/microjobs")
    .then(r => r.json())
    .then(d => {
      d.forEach(job => {
        let div = document.createElement("div");
        div.className = "search-item";
        div.innerHTML = `
          <h3>${job.title}</h3>
          <p>${job.shortDesc}</p>
          <p>Price: ${job.price}</p>
        `;
        microjobsContainer.appendChild(div);
      });
    });
}

function showRecommendations() {
  let recSec = document.getElementById("recommendationsContainer");
  if (!recSec) return;
  recSec.innerHTML = "";
  fetch("/api/recommendations", { credentials: "include" })
    .then(r => r.json())
    .then(d => {
      d.forEach(item => {
        let div = document.createElement("div");
        div.className = "search-item";
        div.innerHTML = `
          <h3>${item.title}</h3>
          <p>Location: ${item.location}</p>
          <p>Zip Code: ${item.zipCode || ""}</p>
          <p>Company: ${item.company}</p>
          <p>Category: ${item.category}</p>
          <p>${timeDiffString(item.createdAt)} ago</p>
        `;
        recSec.appendChild(div);
      });
    });
}

function showProfileCompleteness() {
  let bar = document.getElementById("profileCompletenessBar");
  if (!bar) return;
  fetch("/api/auth/me", { credentials: "include" })
    .then(r => r.json())
    .then(d => {
      if (!d.user) return;
      let fields = ["displayName", "email", "phone", "location", "zip", "website", "description", "pic"];
      let filled = fields.filter(f => d.user[f] && d.user[f].length > 0).length;
      let percent = Math.floor((filled / fields.length) * 100);
      bar.innerHTML = `<span style="width:${percent}%;">${percent}%</span>`;
    });
}

function showAIProposalsSection() {
  let sec = document.getElementById("aiProposalsSection");
  if (sec) sec.style.display = "block";
}

function showLiveBiddingSection() {
  let sec = document.getElementById("liveBiddingSection");
  if (sec) sec.style.display = "block";
}

function showEscrowSection() {
  let sec = document.getElementById("escrowSection");
  if (sec) sec.style.display = "block";
}

function showSkillVerification() {
  let sec = document.getElementById("skillVerificationSection");
  if (sec) sec.style.display = "block";
}

function showRatingsSystem() {
  let sec = document.getElementById("ratingsSection");
  if (sec) sec.style.display = "block";
}

function showTimeTracking() {
  let sec = document.getElementById("timeTrackingSection");
  if (sec) sec.style.display = "block";
}

function showChatVideo() {
  let sec = document.getElementById("chatVideoSection");
  if (sec) sec.style.display = "block";
}

function showMilestoneTracking() {
  let sec = document.getElementById("milestoneTrackingSection");
  if (sec) sec.style.display = "block";
}

function showGamification() {
  let sec = document.getElementById("gamificationSection");
  if (sec) sec.style.display = "block";
}

function handlePicFiles(files, previewEl) {
  let f = files[0];
  if (!f) return;
  if (!f.type.startsWith("image/")) {
    alert("Please drop an image file.");
    return;
  }
  let r = new FileReader();
  r.onload = e => {
    previewEl.src = e.target.result;
    previewEl.style.display = "block";
  };
  r.readAsDataURL(f);
}
