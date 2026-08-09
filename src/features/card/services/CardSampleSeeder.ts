import type { ICardRepository } from '../interfaces/ICardRepository';
import type { ICardSearchIndexResolver } from '../interfaces/ICardSearchIndexResolver';
import { sampleCardsSeededStorage } from '../storage/cardStorage';
import type { CreateCardInput, SavedCard, SubjectTag } from '../types';

export type SampleCardDescriptor = {
  filename: string;
  title: string;
};

const SAMPLE_ASSET_BASE_URL = 'https://assets.codepen.io/89905/';

export const SAMPLE_CARD_DESCRIPTORS: SampleCardDescriptor[] = [
  { filename: 'coverflow--Front-1024x1024.jpg', title: 'Front' },
  { filename: 'coverflow--A-Thousand-Clouds-Front-Cover-1024x1024.jpg', title: 'A Thousand Clouds' },
  { filename: 'coverflow--Odd-World-EP-SMALL-1024x1024.png', title: 'Odd World EP' },
  { filename: 'coverflow--Forest-Blue-Pre-LR-1024x1024.png', title: 'Forest Blue' },
  { filename: 'coverflow--MOM-Remixes-1024x1024.jpg', title: 'MOM Remixes' },
  { filename: 'coverflow--ALONE-TOGETHER-remix-V71-550x550.jpg', title: 'ALONE TOGETHER' },
  { filename: 'coverflow--Nature-Therapy-Pre-LR-550x550.png', title: 'Nature Therapy' },
  { filename: 'coverflow--Deep-Dive-Ambient-Edits-V8-550x550.jpg', title: 'Deep Dive Ambient Edits' },
  { filename: 'coverflow--Alpine-Koresma-x-Aroth-Artwork-550x550.jpg', title: 'Alpine' },
  { filename: 'coverflow--Out-Of-the-Dark-Cover-550x550.jpg', title: 'Out Of The Dark' },
  { filename: 'coverflow--2020-06-07-Marley-Carroll-Single-Blue-550x550.jpg', title: 'Marley Carroll Single Blue' },
  { filename: 'coverflow--Deep-Dive-EP-Cover-550x550.jpg', title: 'Deep Dive EP' },
  { filename: 'coverflow--Blackrose-Cover-550x550.jpg', title: 'Blackrose' },
  { filename: 'coverflow--FW-Imagine-Gold-Remixes2-550x550.jpg', title: 'Imagine Gold Remixes' },
  { filename: 'coverflow--We-Are-COVER-MAIN-550x550.jpg', title: 'We Are' },
  { filename: 'coverflow--Bath-House-Flat-550x550.jpg', title: 'Bath House' },
  { filename: 'coverflow--Pronoia-JPG-550x550.jpg', title: 'Pronoia' },
  { filename: 'coverflow--Lapa9Theory-Cracking-Stores-no-Loci-logo-550x550.jpg', title: 'Lapa9Theory Cracking Stores' },
  { filename: 'coverflow--EMANCIPATOR_MOM_AlbumCover-2000px-550x550.jpg', title: 'EMANCIPATOR MOM' },
  { filename: 'coverflow--MURGE-ep-cvr-3000x3000-550x550.jpg', title: 'MURGE EP' },
  { filename: 'coverflow--Emancipator_Laybrinth-ART-01-4000x4000-at-300dpi-550x550.jpg', title: 'Emancipator Labyrinth' },
  { filename: 'coverflow--cover-550x550.jpg', title: 'Loci Cover' },
];

function createSampleCardInput(title: string): CreateCardInput {
  const now = Date.now();

  return {
    source: {
      url: '#sample',
      hostname: 'samples.xiaocha.local',
      pageTitle: title,
      selectionText: title,
      surroundingContext: '',
      trigger: 'text-selection',
      savedAt: now,
    },
    sections: [],
  };
}

export class CardSampleSeeder {
  constructor(
    private readonly repository: ICardRepository,
    private readonly searchIndexResolver: ICardSearchIndexResolver,
  ) {}

  async seedSampleCardsIfEmpty(): Promise<void> {
    const alreadySeeded = await sampleCardsSeededStorage.getValue();
    if (alreadySeeded) {
      return;
    }

    const existingCards = await this.repository.list();
    if (existingCards.length > 0) {
      await sampleCardsSeededStorage.setValue(true);
      return;
    }

    await this.createSampleCards();
    await sampleCardsSeededStorage.setValue(true);
  }

  private async createSampleCards(): Promise<void> {
    for (const descriptor of SAMPLE_CARD_DESCRIPTORS) {
      const input = createSampleCardInput(descriptor.title);
      let card: SavedCard = await this.repository.create(input);

      const coverUri = `${SAMPLE_ASSET_BASE_URL}${descriptor.filename}`;
      card = await this.repository.update(card.id, {
        title: descriptor.title,
        category: 'general',
        subjectTags: [] as SubjectTag[],
        pinned: false,
        cover: {
          type: 'external-url',
          uri: coverUri,
          alt: `${descriptor.title} cover`,
          generatedAt: Date.now(),
        },
      });

      const searchIndexText = this.searchIndexResolver.buildIndexText(card);
      await this.repository.update(card.id, { searchIndexText });
    }
  }
}
