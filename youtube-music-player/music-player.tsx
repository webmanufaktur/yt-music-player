"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Heart, Copy, List } from "lucide-react"

export default function Component() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [progress, setProgress] = useState([35])
  const [volume, setVolume] = useState([75])
  const [playlist] = useState([
    { id: 1, title: "Blinding Lights", artist: "The Weeknd", duration: "3:45", isPlaying: true },
    { id: 2, title: "Save Your Tears", artist: "The Weeknd", duration: "3:35", isPlaying: false },
    { id: 3, title: "Can't Feel My Face", artist: "The Weeknd", duration: "3:33", isPlaying: false },
    { id: 4, title: "Starboy", artist: "The Weeknd ft. Daft Punk", duration: "3:50", isPlaying: false },
    { id: 5, title: "The Hills", artist: "The Weeknd", duration: "4:02", isPlaying: false },
  ])

  const copyToClipboard = () => {
    navigator.clipboard.writeText("Blinding Lights - The Weeknd")
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Album Art Section */}
      <div className="relative aspect-square">
        <Image src="/placeholder.svg?height=400&width=400" alt="Album artwork" fill className="object-cover" />
      </div>

      {/* Song Info */}
      <div className="p-4 pb-2">
        <h3 className="font-semibold text-lg text-gray-900 truncate">Blinding Lights</h3>
        <p className="text-gray-600 text-sm truncate">The Weeknd</p>
      </div>

      {/* Progress Bar */}
      <div className="px-4 pb-2">
        <Slider
          value={progress}
          onValueChange={setProgress}
          max={100}
          step={1}
          className="w-full [&>span:first-child]:h-1 [&>span:first-child]:bg-gray-200 [&_[role=slider]]:bg-red-500 [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-red-500 [&_[role=slider]:focus-visible]:ring-0 [&_[role=slider]:focus-visible]:ring-offset-0"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1:23</span>
          <span>3:45</span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center gap-4 px-4 py-3">
        <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-600 hover:text-gray-900">
          <Shuffle className="w-4 h-4" />
        </Button>

        <Button variant="ghost" size="icon" className="w-10 h-10 text-gray-600 hover:text-gray-900">
          <SkipBack className="w-5 h-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-full"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
        </Button>

        <Button variant="ghost" size="icon" className="w-10 h-10 text-gray-600 hover:text-gray-900">
          <SkipForward className="w-5 h-5" />
        </Button>

        <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-600 hover:text-gray-900">
          <Repeat className="w-4 h-4" />
        </Button>
      </div>

      {/* Secondary Controls */}
      <div className="flex items-center justify-between px-4 pb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-gray-600 hover:text-gray-900"
            onClick={() => setIsLiked(!isLiked)}
            asChild
          >
            <a href="#" className="flex items-center justify-center">
              <Heart className={`w-4 h-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
            </a>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-gray-600 hover:text-gray-900"
            onClick={copyToClipboard}
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>

        <Drawer defaultOpen={true}>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-600 hover:text-gray-900">
              <List className="w-4 h-4" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Playlist</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 max-h-96 overflow-y-auto">
              {playlist.map((song) => (
                <div
                  key={song.id}
                  className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer ${
                    song.isPlaying ? "bg-red-50 border-l-4 border-red-500" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center">
                      {song.isPlaying ? (
                        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        </div>
                      ) : (
                        <Play className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h4 className={`font-medium text-sm ${song.isPlaying ? "text-red-600" : "text-gray-900"}`}>
                        {song.title}
                      </h4>
                      <p className="text-xs text-gray-500">{song.artist}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{song.duration}</span>
                </div>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  )
}
