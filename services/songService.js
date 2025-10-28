const CustomSong = require("../models/CustomSong");
const CustomPlaylist = require("../models/CustomPlaylist");

const getSongById = async (id) => {
  return await CustomSong.findOne({ id: id });
};

const createSong = async (songData) => {
  const newSong = new CustomSong(songData);
  return await newSong.save();
};

const updateSong = async (id, songData) => {
  return await CustomSong.findByIdAndUpdate(id, songData, { new: true });
};

const getSongs = async (playlistId = null) => {
  const allSongs = await CustomSong.find();
  if (playlistId){
    const { videos } = await CustomPlaylist.findById(playlistId);
    console.log(videos);
    
    return allSongs.filter((song) => videos.includes(song.id))
  }
  return allSongs;

};


module.exports = {
  getSongById,
  createSong,
  updateSong,
  getSongs,
};
