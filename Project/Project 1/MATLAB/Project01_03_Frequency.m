% Project 01: evaluate the taught transfer functions at s = j*omega.
% Base MATLAB only; no Control System Toolbox is required.
clearvars; close all; clc;
folder = fullfile(fileparts(mfilename('fullpath')), 'Plots');
if ~exist(folder, 'dir'), mkdir(folder); end
m = 80; kc = 1000*[18 1.5; 18 0]; % kN data -> N-based SI
labels = {'A','B'};
names = {'Design A: c=1.5 kN s/m','Design B: c=0 kN s/m'};
colors = [0 .35 .70; .90 .32 .00; .08 .08 .08; .55 .18 .70];
lineStyles = {'-','--','-.',':'};
w = unique([logspace(-1,2.5,1200)'; 15]); s = 1i*w; H60 = zeros(size(kc,1),1);
f = figure('Visible','off','Color','w','Position',[100 100 1400 650]);
ax1 = axes(f); hold(ax1,'on');
for n = 1:size(kc,1)
    k = kc(n,1); c = kc(n,2);
    Hx = (c*s+k)./(m*s.^2+c*s+k);
    Hx(~isfinite(Hx)) = NaN;
    semilogx(ax1,w,20*log10(abs(Hx)),'Color',colors(n,:), ...
        'LineStyle',lineStyles{n},'LineWidth',2);
    H60(n) = 20*log10(abs((c*1i*60+k)/(m*(1i*60)^2+c*1i*60+k)));
    file = sprintf('Project01_Frequency%s.csv',labels{n});
    writematrix([w 20*log10(abs(Hx))],fullfile(folder,file));
end
for ax = ax1
    set(ax,'XScale','log','YScale','linear','FontSize',16,'Color','w');
    set(ax,'XColor','k','YColor','k'); grid(ax,'on');
    xline(ax,15,'k:','Design B: resonance');
    xlim(ax,[.1 10^2.5]); xlabel(ax,'Frequency (rad/s), log scale');
end
ylabel(ax1,'Magnitude (dB)'); title(ax1,'Seat / floor Bode magnitude');
legend(ax1,names,'Location','northeast','TextColor','k','Color','w');
set(findall(f,'Type','text'),'Color','k');
exportgraphics(f,fullfile(folder,'Project01_Frequency.png'), ...
    'Resolution',200);
values = compose('%.2f',H60);
disp(table(names',values,'VariableNames',{'Candidate','Magnitude_dB_at60'}));
