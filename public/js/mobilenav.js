function opennav(){
  let mnav = document.getElementById("mobilenav")
  let navbar = document.getElementById("navbar")
  let welcometxt = document.getElementById("welcome-txt")
  let welcomemnu = document.getElementById("welcome-mnu")

mnav.addEventListener("click", ()=>{
navbar.classList.toggle("show")
mnav.classList.toggle("show")
})

welcometxt.addEventListener("click", ()=>{
welcomemnu.classList.toggle("show")
})
}
window.addEventListener("load", opennav)