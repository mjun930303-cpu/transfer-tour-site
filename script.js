fetch("/data/tour.json")
  .then(res => res.json())
  .then(data => {
    document.getElementById("tour-content").innerText = data.tourInfo;

    const list = document.getElementById("course-list");

    data.courses.forEach(course => {
      const card = document.createElement("div");
      card.className = "course-card";

      card.innerHTML = `
        <h3>${course.title}</h3>
        <img src="${course.image}" alt="">
        <p>${course.description}</p>
        <a href="${course.link}" target="_blank">
          <button>예약하기</button>
        </a>
      `;

      list.appendChild(card);
    });
  });