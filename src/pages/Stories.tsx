import React, { useState } from 'react';
import { ChevronRight, Search, Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Eye } from 'lucide-react';
import { THREADS_DATA, storyShowcase } from '../data/mockData';
import { Link } from 'react-router-dom';

export default function Stories() {
  const [search, setSearch] = useState('');

  return (
    <div className="bg-gray-100 min-h-screen pb-20 font-sans text-black border-b border-black">
      {/* Hero & Search */}
      <section className="bg-black text-white p-8 md:p-16 lg:p-20 relative overflow-hidden flex flex-col items-center justify-center text-center">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
        <div className="relative z-10 max-w-3xl w-full">
          <div className="text-orange-500 font-bold tracking-widest text-sm mb-4 flex items-center justify-center gap-2">
            <span className="w-3 h-3 bg-orange-500 border border-white inline-block"></span>
            COMMUNITY THREADS
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-8 leading-snug">
            팀의 성장을 이끄는<br/>인사이트 아카이브
          </h1>
          
          <div className="w-full max-w-2xl mx-auto flex bg-white border-2 border-black focus-within:shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] transition-all">
            <div className="pl-6 flex items-center justify-center bg-white">
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            <input 
              type="text" 
              placeholder="관심있는 마케팅 전략, IT 개발 회고를 검색해보세요"
              className="flex-1 px-4 py-5 outline-none font-bold placeholder:text-gray-400 text-black text-lg bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="bg-orange-500 px-8 font-black text-black border-l-2 border-black hover:bg-black hover:text-white transition-colors">
              검색
            </button>
          </div>
        </div>
      </section>

      {/* Highlight Slider */}
      <section className="border-y border-black bg-white overflow-hidden py-12 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-end mb-8">
          <h2 className="text-2xl font-black tracking-tight">🔥 이번 주 주목받는 스토리</h2>
          <div className="flex gap-2">
            <button className="w-10 h-10 border border-black flex items-center justify-center hover:bg-orange-500 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all bg-white">
              <ChevronRight className="w-6 h-6 rotate-180" />
            </button>
            <button className="w-10 h-10 border border-black flex items-center justify-center hover:bg-orange-500 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all bg-white">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="flex overflow-x-auto px-6 md:px-12 gap-6 snap-x hide-scrollbar pb-8">
          {storyShowcase.map((story) => (
            <div key={story.id} className="min-w-[300px] md:min-w-[360px] border border-black bg-white group cursor-pointer hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all flex flex-col snap-center">
              <div className="h-40 border-b border-black overflow-hidden relative">
                <img src={story.img} alt={story.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                <div className="absolute top-3 left-3 bg-black text-white px-3 py-1 text-[10px] uppercase tracking-widest font-bold border border-white">
                  {story.tag}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-center">
                <h3 className="text-lg font-black leading-snug group-hover:text-orange-600 transition-colors">
                  {story.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Thread Masonry Grid */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
          {THREADS_DATA.filter(post => 
            post.title.includes(search) || post.content.includes(search) || post.authorName.includes(search)
          ).map((post) => (
            <article key={post.id} className="break-inside-avoid border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] hover:-translate-y-1 transition-all flex flex-col cursor-pointer group">
              {/* Header */}
              <div className="p-6 flex justify-between items-start">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 border-2 border-black flex items-center justify-center font-black text-xl bg-orange-100 text-orange-600 flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {post.author}
                  </div>
                  <div>
                    <div className="font-black text-base flex items-center gap-1 group-hover:text-orange-600 transition-colors">
                      {post.authorName}
                    </div>
                    <div className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-wider">{post.role}</div>
                  </div>
                </div>
                <button className="p-1 hover:bg-gray-100 border border-transparent hover:border-black transition-colors">
                  <MoreHorizontal className="w-5 h-5 text-gray-400 hover:text-black"/>
                </button>
              </div>

              {/* Body */}
              <div className="px-6 pb-6">
                {post.title && <h3 className="font-black text-xl mb-4 leading-snug">{post.title}</h3>}
                <p className="text-sm font-medium text-gray-700 leading-relaxed whitespace-pre-line mb-6 break-words">
                  {post.content}
                </p>
                {post.img && (
                  <div className="w-full border-2 border-black overflow-hidden mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <img src={post.img} alt={post.title} className="w-full h-auto object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                  </div>
                )}
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-bold text-gray-400">
                  <span className="flex items-center gap-1">{post.time}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5"/> {post.views} Views</span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 border-t-2 border-black flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-6 text-gray-500">
                  <button className="flex items-center gap-2 hover:text-orange-500 transition-colors group/btn">
                    <Heart className="w-5 h-5 group-hover/btn:fill-orange-500" /> <span className="text-sm font-bold">{post.likes > 0 ? post.likes : ''}</span>
                  </button>
                  <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                    <MessageCircle className="w-5 h-5" /> <span className="text-sm font-bold">{post.comments > 0 ? post.comments : ''}</span>
                  </button>
                  <button className="flex items-center gap-2 hover:text-green-500 transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
                <button className="text-gray-500 hover:text-black transition-colors">
                  <Bookmark className="w-5 h-5" />
                </button>
              </div>
            </article>
          ))}
        </div>
        
        <div className="mt-16 flex justify-center">
          <button className="px-10 py-5 font-black text-lg border-2 border-black bg-white hover:bg-black hover:text-white transition-colors shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1">
            스토리 더 불러오기
          </button>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
