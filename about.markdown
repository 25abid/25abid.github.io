---
layout: default
title: About
permalink: /about/
description: About Abdulkader Alturkmani, a University of Toronto student working across geospatial data science, software, and design.
---
<div class="about-page">
  <section class="hero about-hero">
    <p class="eyebrow">A little about me</p>
    <h1 class="hero-title">Data, places,<br>and <span><em>possibilities.</em></span></h1>
    <p>{{ site.data.profile.about_intro }}</p>
    {% include resume-links.html %}
  </section>

  <section class="profile-section" aria-labelledby="experience-heading">
    <h2 id="experience-heading">Experience</h2>
    {% for role in site.data.profile.experience %}
    <article class="profile-entry">
      <div class="about-row"><h3>{{ role.title }} · {{ role.organization }}</h3><p class="about-meta">{{ role.period }}</p></div>
      <p class="project-tech">{{ role.tools }}</p>
      <p>{{ role.description }}</p>
    </article>
    {% endfor %}
  </section>

  <section class="profile-section" aria-labelledby="education-heading">
    <h2 id="education-heading">Education</h2>
    {% assign education = site.data.profile.education %}
    <div class="profile-entry">
      <div class="about-row"><h3>{{ education.institution }}</h3><p class="about-meta">{{ education.period }}</p></div>
      <p>{{ education.degree }}. {{ education.major }} major; {{ education.minors | join: ' and ' }} minors.</p>
      <details><summary>Selected coursework</summary><ul class="about-list">{% for course in education.coursework %}<li>{{ course }}</li>{% endfor %}</ul></details>
    </div>
  </section>

  <section class="profile-section" aria-labelledby="practice-heading">
    <h2 id="practice-heading">What I work with</h2>
    <dl class="skills-list">{% for skill in site.data.profile.skills %}<div><dt>{{ skill.area }}</dt><dd>{{ skill.detail }}</dd></div>{% endfor %}</dl>
    <p class="profile-work-link">For the projects behind these tools, <a href="{{ '/work/' | relative_url }}">explore my work &rarr;</a></p>
  </section>

  <section class="profile-section" aria-labelledby="certificates-heading">
    <h2 id="certificates-heading">Certifications & learning</h2>
    {% for certificate in site.data.profile.certifications %}
    <div class="certificate-row"><div><h3>{{ certificate.name }}</h3><p>{{ certificate.issuer }}</p></div><span>{{ certificate.status }}</span></div>
    {% endfor %}
  </section>
</div>
