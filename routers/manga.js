const router = require("express").Router();
const cheerio = require("cheerio");
const baseUrl = require("../constants/urls");
const replaceMangaPage = "https://komiku.id/manga/";
const AxiosService = require("../helpers/axiosService");

// manga popular ----Ignore this for now --------
router.get("/manga/popular", async (req, res) => {
  res.send({
    message: "nothing",
  });
});

//mangalist pagination  -------Done------
router.get("/manga/page/:pagenumber", async (req, res) => {
  let pagenumber = req.params.pagenumber;
  let url =
    pagenumber === "1"
      ? "https://data.komiku.id/pustaka/"
      : `https://data.komiku.id/pustaka/page/${pagenumber}/`;

  try {
    const response = await AxiosService(url);
    console.log(url);
    if (response.status === 200) {
      const $ = cheerio.load(response.data);
      const element = $(".perapih");
      let manga_list = [];
      let title, type, updated_on, endpoint, thumb, chapter, desc;

      element.find(".daftar > .bge").each((idx, el) => {
        title = $(el).find(".kan > a").find("h3").text().trim();
        endpoint = $(el).find("a").attr("href").replace(replaceMangaPage, "");
        type = $(el).find(".bgei > a").find(".tpe1_inf > b").text();
        updated_on = $(el).find(".kan > span").text().split("• ")[1].trim();
        thumb = $(el).find(".bgei > a").find("img").attr("data-src");
        desc = $(el).find(".kan > p").text().trim();
        chapter = $(el)
          .find("div.kan > div:nth-child(5) > a > span:nth-child(2)")
          .text();
        manga_list.push({
          title,
          thumb,
          type,
          updated_on,
          endpoint,
          chapter,
          desc,
        });
      });
      return res.status(200).json({
        status: true,
        message: "success",
        manga_list,
      });
    }
    return res.send({
      message: response.status,
      manga_list: [],
    });
  } catch (err) {
    res.send({
      status: false,
      message: err,
      manga_list: [],
    });
  }
});

// detail manga  ---- Done -----
router.get("/manga/detail/:slug", async (req, res) => {
  const slug = req.params.slug;
  let endpoint;
  console.log(slug);
  if(slug === 'tokyo%e5%8d%8drevengers'){
    endpoint = 'tokyo卍revengers/';
  }else{
    endpoint = slug;
  }
  try {
    const response = await AxiosService(`manga/${endpoint}/`);
    const $ = cheerio.load(response.data);
    const element = $(".perapih");
    let genre_list = [];
    let chapter = [];
    const obj = {};

    /* Get Title, Type, Author, Status */
    const getMeta = element.find(".inftable > tbody").first();
    obj.title = $("#Judul > h1").text().trim();
    obj.type = $("tr:nth-child(2) > td:nth-child(2)").find("b").text();
    obj.author = $("#Informasi > table > tbody > tr:nth-child(4) > td:nth-child(2)")
      .text()
      .trim();
    obj.status = $(getMeta).children().eq(4).find("td:nth-child(2)").text();

    /* Set Manga Endpoint */
    obj.manga_endpoint = slug;

    /* Get Manga Thumbnail */
    obj.thumb = element.find(".ims > img").attr("src");

    element.find(".genre > li").each((idx, el) => {
      let genre_name = $(el).find("a").text();
      genre_list.push({
        genre_name,
      });
    });

    obj.genre_list = genre_list || [];

    /* Get Synopsis */
    const getSinopsis = element.find("#Sinopsis").first();
    obj.synopsis = $(getSinopsis).find("p").text().trim();

    /* Get Chapter List */
    $("#Daftar_Chapter > tbody")
      .find("tr")
      .each((index, el) => {
        let chapter_title = $(el).find("a").text().trim();
        let chapter_endpoint = $(el).find("a").attr("href");
        if (chapter_endpoint !== undefined) {
          const rep = chapter_endpoint.replace("/ch/", "");
          chapter.push({
            chapter_title,
            chapter_endpoint: rep,
          });
        }
        obj.chapter = chapter;
      });

    res.status(200).send(obj);
  } catch (error) {
    console.log(error);
    res.send({
      status: false,
      message: error,
    });
  }
});

//serach manga ------Done-----------
router.get("/search/:query", async (req, res) => {
  const query = req.params.query;
  const url = `https://data.komiku.id/cari/?post_type=manga&s=${query}`;

  try {
    const response = await AxiosService(url);
    const $ = cheerio.load(response.data);
    const element = $(".daftar");
    let manga_list = [];
    let title, thumb, type, endpoint, updated_on;
    element.find(".bge").each((idx, el) => {
      endpoint = $(el)
        .find("a")
        .attr("href")
        .replace(replaceMangaPage, "")
        .replace("/manga/", "");
      thumb = $(el).find("div.bgei > a > img").attr("data-src");
      type = $(el).find("div.bgei > a > div.tpe1_inf > b").text();
      title = $(el).find(".kan").find("h3").text().trim();
      updated_on = $(el).find("div.kan > p").text().split(".")[0].trim();
      manga_list.push({
        title,
        thumb,
        type,
        endpoint,
        updated_on,
      });
    });
    res.json({
      status: true,
      message: "success",
      manga_list,
    });
  } catch (error) {
    res.send({
      status: false,
      message: error.message,
    });
  }
});

//genreList  -----Done-----
router.get("/genres", async (req, res) => {
  try {
    const response = await AxiosService();

    const $ = cheerio.load(response.data);
    let list_genre = [];
    let obj = {};
    $("#Filter > form > select:nth-child(2)")
      .find("option")
      .each((idx, el) => {
        if ($(el).text() !== "Genre 1") {
          const endpoint = $(el)
            .text()
            .trim()
            .split(" ")
            .join("-")
            .toLowerCase();
          list_genre.push({
            genre_name: $(el).text(),
            endpoint,
          });
        }
      });
    obj.status = true;
    obj.message = "success";
    obj.list_genre = list_genre;
    res.json(obj);
  } catch (error) {
    res.send({
      status: false,
      message: error,
    });
  }
});

//genreDetail ----Done-----
router.get("/genres/:slug/:pagenumber", async (req, res) => {
  const slug = req.params.slug;
  const pagenumber = req.params.pagenumber;
  const url =
    pagenumber === "1"
      ? `https://data.komiku.id/pustaka/?orderby=modified&genre=${slug}&genre2=&status=&category_name=`
      : `https://data.komiku.id/pustaka/page/${pagenumber}/?orderby=modified&genre=${slug}&genre2&status&category_name`;
  try {
    const response = await AxiosService(url);
    const $ = cheerio.load(response.data);
    const element = $(".daftar");
    var thumb, title, endpoint, type;
    var manga_list = [];
    element.find(".bge").each((idx, el) => {
      title = $(el).find(".kan").find("h3").text().trim();
      endpoint = $(el).find("a").attr("href").replace(replaceMangaPage, "");
      type = $(el).find("div.bgei > a > div").find("b").text();
      thumb = $(el).find("div.bgei > a > img").attr("data-src");
      manga_list.push({
        title,
        type,
        thumb,
        endpoint,
      });
    });
    res.json({
      status: true,
      message: "success",
      manga_list,
    });
  } catch (error) {
    res.send({
      status: false,
      message: error,
      manga_list: [],
    });
  }
});

// hot manga
router.get("/manga/hot/:page", async (req, res) => {
  const page = req.params.page;
  const url = page === "1" 
    ? `other/hot/?orderby=modified&category_name=manga/`
    : `other/hot/page/${page}/?orderby=modified&category_name=manga/`;

    try {
      const response = await AxiosService(url);
      const $ = cheerio.load(response.data);
      const element = $(".daftar");
      let thumb, title, endpoint, type, upload_on, views, title_id, short_desc, genre;
      let manga_list = [];
      element.find(".bge").each((idx, el) => {
        title = $(el).find(".kan").find("h3").text().trim();
        endpoint = $(el).find("a").attr("href").replace(replaceMangaPage, "").replace("/manga/", "");
        genre = $(el).find("div.bgei > a > .tpe1_inf").text().split("\t").join('').trim();
        thumb = $(el).find("div.bgei > a > img").attr("data-src");
        upload_on = $(el).find("div.kan > p").text().split(".")[0].trim();
        short_desc = $(el).find("div.kan > p").text().split(".")[1].trim();
        views = $(el).find("div.vw").text().trim();
        title_id = $(el).find("div.kan > span").text().trim();

        manga_list.push({
          title,
          title_id,
          genre,
          thumb,
          endpoint,
          views,
          short_desc,
          upload_on,
        });
      });
      res.json({
        status: true,
        message: "success",
        manga_list,
      });
    }catch (error) {
      res.send({
        status: false,
        message: error,
        manga_list: [],
      });
    }
});

//manga popular pagination ----- Done ------
router.get("/manga/popular/:pagenumber", async (req, res) => {
  const pagenumber = req.params.pagenumber;
  const url =
    pagenumber === "1"
      ? `other/rekomendasi/`
      : `other/rekomendasi/page/${pagenumber}/`;

  try {
    const response = await AxiosService(url);
    const $ = cheerio.load(response.data);
    const element = $(".daftar");
    let thumb, title, endpoint, type, upload_on, views;
    let manga_list = [];
    element.find(".bge").each((idx, el) => {
      title = $(el).find(".kan").find("h3").text().trim();
      endpoint = $(el)
        .find("a")
        .attr("href")
        .replace(replaceMangaPage, "")
        .replace("/manga/", "");
      type = $(el).find("div.bgei > a > div.tpe1_inf > b").text();
      thumb = $(el).find("div.bgei > a > img").attr("data-src");
      upload_on = $(el).find("div.kan > p").text().split(".")[0].trim();
      views = $(el).find("div.vw").text().trim();
      manga_list.push({
        title,
        type,
        thumb,
        endpoint,
        views,
        upload_on,
      });
    });
    res.json({
      status: true,
      message: "success",
      manga_list,
    });
  } catch (error) {
    res.send({
      status: false,
      message: error,
      manga_list: [],
    });
  }
});


// new update home
router.get("/new-update", async(req, res) => {
  try{
    const response = await AxiosService();
    const $ = cheerio.load(response.data);
    const element = $("#Terbaru > .ls4w > .ls4");
    let thumb, title, endpoint, type, upload_on, views, chapter;
    let manga_list = [];

    element.each((idx, el) => {
      title = $(el).find("div.ls4j > h4").text();
      thumb = $(el).find("div.ls4v > a > img").attr("data-src");
      endpoint = $(el).find("div.ls4j > a").attr("href").split('/ch/').join('');
      type = $(el).find("div.ls4j > span").text();
      chapter = $(el).find("div.ls4j > a").text();
      views = $(el).find("div.ls4v > .vm").text().trim();

      manga_list.push({
        title,
        chapter,
        endpoint,
        thumb,
        type,
        upload_on,
        views,
      });
    });

    return res.json({
      status: true,
      message: "success",
      manga_list,
    });
  }catch(error){
    res.send({
      status: false,
      message: error,
    });
  }
});

// komik hot
router.get("/komik/hot", async(req, res) => {
  try{
    const reponse = await AxiosService();
    const $ = cheerio.load(reponse.data);
    const element = $("#Komik_Hot > .perapih");
    let thumb, title, endpoint, type, upload_on, views, genre, chapter, warna;
    let manga_list = [];

    element.find("div.ls112 > .ls12 > .ls2").each((idx, el) => {
      title = $(el).find("div.ls2j > h4").text().trim();
      endpoint = $(el).find("div.ls2j > a").attr("href").split('/ch/').join('');
      chapter = $(el).find("div.ls2j > a").text();
      thumb = $(el).find("a > img").attr("data-src");
      type = $(el).find("div.ls2j > span").text().trim();
      views = $(el).find("div.ls2v > .vw").text().trim();

        manga_list.push({
          title,
          chapter,
          endpoint,
          thumb,
          type,
          upload_on,
          views,
      });
    });

    return res.json({
      status: true,
      message: "success",
      manga_list,
    });
  }catch(error){
    res.send({
      status: false,
      message: error,
    });
  }
});

// trending
router.get("/trending", async(req,res) => {
  try{
    const response = await AxiosService();
    const $ = cheerio.load(response.data);
    const element = $("#Trending > .perapih > .ls123 > .ls23");
    const element_top = $("#Trending > .cv");
    let manga_list = [];
    let manga_top = {};
    let title, thumb, endpoint, release;

    manga_top.title = element_top.find("div.ls12j > h3").text().trim();
    manga_top.type = element_top.find("div.ls12j > span").text().trim();
    manga_top.endpoint = element_top.find("a").attr("href").split('/ch/').join('').trim();

    element.each((idx, el) => {
        title = $(el).find("div.ls23j > a > h4").text().trim();
        thumb = $(el).find("div.ls23v > a > img").attr("src");
        endpoint = $(el).find("div.ls23j > a").attr("href").split('/ch/').join('').trim();
        release = $(el).find("div.ls23j > a > .ls23t").text().split('- pembacaRilis perdana').join('Update').trim();

        manga_list.push({
          title,
          thumb,
          release,
          endpoint,
        });
    });

    return res.json({
      status: true,
      message: "success",
      manga_top,
      manga_list,
    });

  }catch (error) {
    res.send({
      message: error.message,
    });
  }
});

//recommended ---done---
router.get("/recommended", async (req, res) => {
  try {
    const response = await AxiosService("other/hot/");

    const $ = cheerio.load(response.data);
    const element = $("div.daftar > .bge");
    let manga_list = [];
    let type, title, chapter, update, endpoint, thumb, views, short_desc, title_id;


    element.each((idx, el) => {
      title = $(el).find("div.kan > a > h3").text().trim();
      type = $(el).find("div.tpe1_inf").text().split('\t').join('').trim();
      thumb = $(el).find("div.bgei > a > img").attr("data-src");
      views = $(el).find("div.vw").text().trim();
      update = $(el).find("div.kan > p").text().split(".")[0].trim();
      short_desc = $(el).find("div.kan > p").text().split(".")[1].trim();
      title_id = $(el).find("div.kan > span").text().trim();

      endpoint = $(el).find("div.kan > a").attr("href").split('https://komiku.id/manga/').join('');

      manga_list.push({
        title,
        title_id,
        chapter,
        type,
        thumb,
        endpoint,
        views,
        short_desc,
        update,
      });
    });
    return res.json({
      status: true,
      message: "success",
      manga_list,
    });
  } catch (error) {
    res.send({
      message: error.message,
    });
  }
});


//manhua  ------Done------
router.get("/manhua/:pagenumber", async (req, res) => {
  await getManhuaManhwa(req, res, `manhua`);
});

//manhwa
router.get("/manhwa/:pagenumber", async (req, res) => {
  await getManhuaManhwa(req, res, `manhwa`);
});

const getManhuaManhwa = async (req, res, type) => {
  let pagenumber = req.params.pagenumber;
  let url =
    pagenumber === "1"
      ? `https://data.komiku.id/pustaka/?orderby=&category_name=${type}&genre=&genre2=&status=`
      : `https://data.komiku.id/pustaka/page/${pagenumber}/?orderby&category_name=${type}&genre&genre2&status`;

  try {
    console.log(url);
    const response = await AxiosService(url);
    const $ = cheerio.load(response.data);
    const element = $(".perapih");
    var manga_list = [];
    var title, type, updated_on, endpoint, thumb, chapter;

    element.find(".daftar > .bge").each((idx, el) => {
      title = $(el).find(".kan > a").find("h3").text().trim();
      endpoint = $(el).find("a").attr("href").replace(replaceMangaPage, "");
      type = $(el).find(".bgei > a").find(".tpe1_inf > b").text().trim();
      updated_on = $(el).find(".kan > span").text().split("• ")[1].trim();
      thumb = $(el).find(".bgei > a").find("img").attr("data-src");
      chapter = $(el)
        .find("div.kan > div:nth-child(5) > a > span:nth-child(2)")
        .text();
      manga_list.push({
        title,
        thumb,
        type,
        updated_on,
        endpoint,
        chapter,
      });
    });

    res.status(200).json({
      status: true,
      message: "success",
      manga_list,
    });
  } catch (error) {
    console.log(error);
    res.send({
      status: false,
      message: error,
      manga_list: [],
    });
  }
};

module.exports = router;
