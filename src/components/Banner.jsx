import Slider from "react-slick";
import banner1 from "../assets/Banner1.jpeg";
import banner2 from "../assets/Banner2.jpeg";
import banner3 from "../assets/Banner3.jpeg";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./Banner.css";
import { useNavigate } from "react-router-dom";

function Banner() {
  const navigate = useNavigate();
  const settings = {
    dots: true,
    infinite: true,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000, // 10 seconds
    arrows: true,         // enable arrows
  };

  const handleBannerClick = () => {
    navigate('/products-sidebar');
  };

  return (
    <div className="banner-slider">
      <Slider {...settings}>
        <div>
          <img src={banner1} alt="Banner 1" className="banner-image" onClick={handleBannerClick} style={{cursor:'pointer'}} />
        </div>
        <div>
          <img src={banner2} alt="Banner 2" className="banner-image" onClick={handleBannerClick} style={{cursor:'pointer'}} />
        </div>
        <div>
          <img src={banner3} alt="Banner 3" className="banner-image" onClick={handleBannerClick} style={{cursor:'pointer'}} />
        </div>
      </Slider>
    </div>
  );
}

export default Banner;
