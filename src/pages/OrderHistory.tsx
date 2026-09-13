import React from 'react';
import { imageUrl } from '../config';
import { Order, TailoringJob } from '../types';

interface OrderHistoryProps {
  orders: Order[];
  tailoringJobs: TailoringJob[];
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ orders, tailoringJobs }) => {
  return (
    <div className="bg-brand-white min-h-screen py-12 md:py-20 animate-fadeIn">
      <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-16">
        <div className="text-center mb-16 space-y-4">
          <h4 className="text-[10px] md:text-xs font-bold text-brand-gold uppercase tracking-[0.4em]">Customer Portal</h4>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-brand-earth tracking-tight">Order Registry</h1>
          <div className="w-16 h-1 bg-brand-gold mx-auto rounded-full"></div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[40px] shadow-xl border border-brand-silver/30">
            <div className="w-20 h-20 bg-brand-silver/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fa-solid fa-box-open text-brand-earth/20 text-3xl"></i>
            </div>
            <h3 className="text-xl font-serif font-bold text-brand-earth mb-2">No Orders Found</h3>
            <p className="text-brand-earth/50 text-sm mb-8">Your textile journey hasn't started yet.</p>
            <button className="bg-brand-earth text-brand-gold px-10 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition shadow-xl">
              Begin Exploration
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map(order => {
              const job = tailoringJobs.find(j => j.orderId === order.id);
              return (
                <div key={order.id} className="bg-white rounded-[32px] md:rounded-[48px] shadow-xl border border-brand-silver/30 overflow-hidden group hover:shadow-2xl transition-all duration-500">
                  <div className="p-8 md:p-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-8 border-b border-brand-silver/20">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-brand-earth/40 uppercase tracking-widest">Order ID</p>
                        <h3 className="text-xl font-mono font-bold text-brand-earth">#{order.id}</h3>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-brand-earth/30 uppercase tracking-widest mb-1">Date</p>
                          <p className="text-sm font-bold text-brand-earth">{new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div className="h-8 w-px bg-brand-silver/30"></div>
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-brand-earth/30 uppercase tracking-widest mb-1">Status</p>
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${order.status === 'Delivered' ? 'bg-brand-mint text-brand-earth' : 'bg-brand-gold/20 text-brand-gold'}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div className="space-y-6">
                        <h4 className="text-[11px] font-black text-brand-earth uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                          <i className="fa-solid fa-list-ul text-brand-gold"></i>
                          Manifest
                        </h4>
                        <div className="space-y-4">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-6 p-4 rounded-2xl bg-brand-silver/5 border border-brand-silver/20 group-hover:bg-white transition-colors">
                              <img src={item.image ? imageUrl(item.image) : "https://placehold.co/200x250?text=No+Image"} className="w-16 h-20 object-cover rounded-xl shadow-md" alt={item.name || ""} onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/200x250?text=No+Image"; }} />
                              <div className="flex-1">
                                <h5 className="font-serif font-bold text-brand-earth text-base">{item.name}</h5>
                                <p className="text-[10px] text-brand-earth/50 font-bold uppercase tracking-widest mt-1">
                                  {item.selectedMeters}m • {item.selectedColor}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-brand-earth">₹{((item.discountPrice || item.pricePerMeter) * item.selectedMeters).toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {job && (
                        <div className="space-y-8 bg-brand-cream/10 p-8 md:p-10 rounded-[32px] md:rounded-[40px] border border-brand-gold/20 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-bl-[100px] pointer-events-none"></div>
                          <h4 className="text-[11px] font-black text-brand-earth uppercase tracking-[0.3em] flex items-center gap-3">
                            <i className="fa-solid fa-scissors text-brand-gold"></i>
                            Artisan Status
                          </h4>
                          
                          <div className="space-y-8">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-brand-earth/40 uppercase tracking-widest">Current Stage</span>
                              <span className="text-xs font-black text-brand-earth uppercase tracking-widest bg-brand-gold px-3 py-1 rounded-lg shadow-sm">{job.currentStatus}</span>
                            </div>

                            <div className="relative h-2 bg-brand-silver/20 rounded-full overflow-hidden">
                              <div 
                                className="absolute top-0 left-0 h-full bg-brand-gold transition-all duration-1000 shadow-[0_0_10px_rgba(184,134,11,0.5)]"
                                style={{ 
                                  width: job.currentStatus === 'Order Received' ? '20%' : 
                                         job.currentStatus === 'Fabric Cutting' ? '40%' :
                                         job.currentStatus === 'Stitching' ? '60%' :
                                         job.currentStatus === 'Quality Check' ? '80%' : '100%'
                                }}
                              ></div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white p-4 rounded-2xl border border-brand-silver/20">
                                <p className="text-[8px] font-black text-brand-earth/30 uppercase tracking-widest mb-1">Tailor Assigned</p>
                                <p className="text-[10px] font-bold text-brand-earth">Master Artisan Unit 04</p>
                              </div>
                              <div className="bg-white p-4 rounded-2xl border border-brand-silver/20">
                                <p className="text-[8px] font-black text-brand-earth/30 uppercase tracking-widest mb-1">Est. Completion</p>
                                <p className="text-[10px] font-bold text-brand-earth">Oct 24, 2023</p>
                              </div>
                            </div>

                            {job.finishedProductImage && (
                              <div className="space-y-4">
                                <p className="text-[9px] font-black text-brand-earth/40 uppercase tracking-widest">Final Masterpiece Preview</p>
                                <div className="aspect-video rounded-2xl overflow-hidden border-2 border-brand-gold shadow-2xl group/final relative">
                                  <img src={job.finishedProductImage} className="w-full h-full object-cover" alt="Final Product" />
                                  <div className="absolute inset-0 bg-brand-earth/40 opacity-0 group-hover/final:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                    <i className="fa-solid fa-magnifying-glass-plus text-white text-2xl"></i>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-12 pt-8 border-t border-brand-silver/20 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <button className="text-[10px] font-black text-brand-earth/40 hover:text-brand-earth transition-colors uppercase tracking-widest flex items-center gap-2">
                          <i className="fa-solid fa-file-invoice"></i>
                          Download Invoice
                        </button>
                        <div className="w-px h-4 bg-brand-silver/30"></div>
                        <button className="text-[10px] font-black text-brand-earth/40 hover:text-brand-earth transition-colors uppercase tracking-widest flex items-center gap-2">
                          <i className="fa-solid fa-headset"></i>
                          Support
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-brand-earth/30 uppercase tracking-widest mb-1">Total Registry Value</p>
                        <p className="text-2xl font-bold text-brand-earth tracking-tighter">₹{order.total.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
