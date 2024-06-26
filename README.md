# Hi there! 👋

```rust
use std::println;

struct Developer {
    name: String,
    age: u32,
    location: String,
    languages: Vec<String>,
}

impl Developer {
    fn new() -> Developer {
        Developer {
            name: String::from("ファース"),
            age: 21,
            location: String::from("Samut Sakorn, Thailand"),
            languages: vec![
                String::from("JavaScript"),
                String::from("TypeScript"),
                String::from("C#"),
                String::from("Python"),
                String::from("Go"),
                String::from("Rust"),
            ],
        }
    }

    fn say_hello(&self) {
        println!("Hello there! I'm {}!", self.name);
        println!("I'm a {}-year-old developer from {}.", self.age, self.location);
        println!("I'm proficient in the following languages:");
        for language in &self.languages {
            println!("- {}", language);
        }
    }
}

fn main() {
    let pyyupsk = Developer::new();
    pyyupsk.say_hello();
}
```

## 👨‍💻 What I do

I enjoy working with various technologies and tools, including:

- **Languages**: JavaScript, TypeScript, C#, Python, Go, Rust
- **Frameworks/Libraries**: Next.js, React, Svelte, Vue.js, Tailwind CSS, Shadcn UI
- **Databases**: MongoDB, PostgreSQL, MySQL, Firebase, Supabase, Prisma
- **Tools**: Git, Docker, VS Code, GitHub, Vercel, Netlify

## 📈 GitHub Stats

<table>
  <tr>
    <td>
      <img src="https://github-readme-stats.vercel.app/api?username=pyyupsk&show_icons=true&theme=onedark&hide_border=true&title_color=67b0e8&text_color=dadada&icon_color=dadada&border_color=141b1e&bg_color=141b1e" alt="Zylo's GitHub Stats">
    </td>
    <td>
      <img src="https://github-readme-streak-stats.herokuapp.com/?user=pyyupsk&theme=onedark&hide_border=true&background=141b1e&stroke=67b0e8&ring=67b0e8&fire=67b0e8&currStreakNum=dadada&sideNums=dadada&currStreakLabel=dadada&sideLabels=dadada&dates=dadada&excludeDaysLabel=dadada" alt="GitHub Streak">
    </td>
  </tr>
</table>

![Custom Activity Graph](https://github-readme-activity-graph.vercel.app/graph?username=pyyupsk&bg_color=141b1e&color=dadada&line=67b0e8&point=dadada&area=true&hide_border=true)

## 📫 Get in touch

- Discord: [pyyupsk](https://discord.com/users/1226475144554483734)
- Email: [pyyupsk@proton.me](mailto:pyyupsk@proton.me)
