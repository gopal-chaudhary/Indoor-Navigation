import {point} from 'leaflet';
export function MouseFollower(map : any){

  const followMouse = document.createElement("div");
  followMouse.className = "follow-mouse";
  document.body.appendChild(followMouse);

const mapCointainer:any = document.querySelector("#map");

mapCointainer.addEventListener("mousemove", function (e:any) {
  const { offsetWidth: mapWidth, offsetHeight: mapHeight } = e.target;
  const { offsetWidth: cordWidth, offsetHeight: cordHeight } = followMouse;

  // get co-ordinates
  let { xp, yp } = getCoords(e);

  // convert point x,y to latlng
  const Point:any = point(xp, yp);
  const coordinates = map.containerPointToLatLng(Point);

  // add coordinates to the div
  followMouse.textContent = coordinates;

  // set the position of the div
  xp = xp + 20 + cordWidth > mapWidth ? xp - cordWidth - 10 : xp + 10;
  yp = yp + 20 + cordHeight > mapHeight ? yp - cordHeight - 10 : yp + 10;

  // followMouse.style.transform = `translate(${xp}px, ${-yp}px)`;
  followMouse.style.left = `${xp}px`;
  followMouse.style.top = `${yp}px`;
});

function getCoords(e:any) {
  let mouseX = e.clientX;
  let mouseY = e.clientY;

  return {
    xp: parseInt(mouseX),
    yp: parseInt(mouseY),
  };
}

}
